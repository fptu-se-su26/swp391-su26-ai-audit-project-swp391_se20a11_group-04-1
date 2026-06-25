FROM python:3.11-slim

# Install git, build tools (required for tree-sitter libraries if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

EXPOSE 4002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4002"]
