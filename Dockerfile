FROM python:3.12-slim

WORKDIR /app

RUN useradd -m -u 10001 appuser

COPY --chown=appuser:appuser . /app

EXPOSE 8987

USER appuser

CMD ["python3", "server.py", "8987"]
