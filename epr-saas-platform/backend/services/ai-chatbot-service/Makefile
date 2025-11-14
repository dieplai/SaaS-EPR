.PHONY: run install test docker-build docker-run clean

run:
	uvicorn app:app --host 0.0.0.0 --port 8003 --reload

install:
	pip install -r requirements.txt

test:
	pytest tests/ -v

docker-build:
	docker build -t ai-chatbot-service:latest .

docker-run:
	docker run -p 8003:8003 --env-file .env ai-chatbot-service:latest

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.log" -delete
