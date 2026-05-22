from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    footballdata_api_key: str = ""
    apifootball_api_key: str = ""
    pulsescore_api_key: str = ""
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    gemini_api_key: str = ""
    grok_api_key: str = ""
    deepseek_api_key: str = ""
    cors_origins: str = "http://localhost:3000"

    model_config = {"env_file": ".env"}


settings = Settings()
