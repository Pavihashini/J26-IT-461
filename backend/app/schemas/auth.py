import re
import unicodedata
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize_mobile(value: str) -> str | None:
    """Accept Sri Lankan local or international notation and store a single identity."""
    value = re.sub(r"[\s()-]", "", value)
    if value.startswith("+94"):
        value = value[3:]
    elif value.startswith("94") and len(value) == 11:
        value = value[2:]
    elif value.startswith("0"):
        value = value[1:]
    return f"+94{value}" if re.fullmatch(r"7\d{8}", value) else None


class RegisterRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    email: str = Field(max_length=254)
    password: str = Field(min_length=8, max_length=128)
    title: Literal["Mr.", "Mrs.", "Ms.", "Miss", "Dr.", "Mx."] | None = None
    first_name: str | None = Field(default=None, min_length=1, max_length=59)
    last_name: str | None = Field(default=None, min_length=1, max_length=60)
    country: Literal["Sri Lanka"] | None = None
    country_code: Literal["+94"] = "+94"
    phone_number: str | None = Field(default=None, max_length=30)
    use_email_username: bool = True
    use_mobile_username: bool = False

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Name is too short.")
        return value

    @field_validator("first_name", "last_name")
    @classmethod
    def clean_name_part(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = " ".join(value.split())
        if not value or not any(c.isalpha() for c in value) or any(not (c.isalpha() or c in " '-.’" or unicodedata.category(c).startswith("M")) for c in value):
            raise ValueError("Use letters, spaces, apostrophes, hyphens or initials for your name.")
        return value

    @model_validator(mode="after")
    def validate_registration(self):
        if not self.use_email_username and not self.use_mobile_username:
            raise ValueError("Select at least one username option.")
        detailed = any(value is not None for value in (self.title, self.first_name, self.last_name, self.country, self.phone_number))
        if detailed:
            if not all((self.title, self.first_name, self.last_name, self.country, self.phone_number)):
                raise ValueError("Title, first name, last name, country and mobile number are required.")
            self.full_name = f"{self.first_name} {self.last_name}"
            if len(self.full_name) > 120:
                raise ValueError("Your full name must be at most 120 characters.")
            normalized = normalize_mobile(self.phone_number)
            if not normalized:
                raise ValueError("Enter a valid Sri Lankan mobile number, such as 0771234567.")
            self.phone_number = normalized
        elif not self.full_name or self.use_mobile_username:
            raise ValueError("Enter your name and registration details.")
        return self

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(c.isalpha() for c in value) or not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one letter and one number.")
        return value

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not EMAIL_PATTERN.match(value):
            raise ValueError("Enter a valid email address.")
        return value


class LoginRequest(BaseModel):
    email: str = Field(description="Email address or Sri Lankan mobile number.")
    password: str

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: str) -> str:
        return value.strip().lower()


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
