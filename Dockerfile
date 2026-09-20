FROM python:3.13-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1     PYTHONUNBUFFERED=1     PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN addgroup --system rtpsc     && adduser --system --ingroup rtpsc --home /app rtpsc

COPY requirements.txt /app/requirements.txt
RUN python -m pip install --upgrade pip     && python -m pip install --requirement /app/requirements.txt

COPY api_server.py celery_worker.py /app/

USER rtpsc

EXPOSE 8000

CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
