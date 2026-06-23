import json
import redis
import os

class ProgressReporter:
    def __init__(self, project_id: int):
        self.project_id = project_id
        redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
        except Exception as e:
            print(f"Redis initialization failed in ProgressReporter: {e}")
            self.redis_client = None

    def report(self, progress: int, status: str, current_step: str, error_message: str = None):
        key = f"arch:progress:{self.project_id}"
        data = {
            "status": status,
            "progress": progress,
            "currentStep": current_step,
            "errorMessage": error_message
        }
        print(f"[Progress Project {self.project_id}] {progress}% - {status} - {current_step}")
        if self.redis_client:
            try:
                self.redis_client.set(key, json.dumps(data), ex=600)  # TTL 10 minutes
            except Exception as e:
                print(f"Failed to write progress to Redis: {e}")
