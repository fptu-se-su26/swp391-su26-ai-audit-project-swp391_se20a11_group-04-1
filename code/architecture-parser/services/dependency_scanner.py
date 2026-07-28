import os
import json

PACKAGE_TO_SERVICE = {
    # npm / package.json
    "stripe":          ("Stripe API",      "stripe",    "payment"),
    "@stripe/stripe-js":("Stripe API",     "stripe",    "payment"),
    "firebase":        ("Firebase",         "firebase",  "baas"),
    "firebase-admin":  ("Firebase Admin",   "firebase",  "baas"),
    "@aws-sdk":        ("AWS Services",     "amazonec2", "cloud"),
    "aws-sdk":         ("AWS Services",     "amazonec2", "cloud"),
    "twilio":          ("Twilio SMS",       "twilio",    "notification"),
    "sendgrid":        ("SendGrid Email",   "sendgrid",  "notification"),
    "@sendgrid/mail":  ("SendGrid Email",   "sendgrid",  "notification"),
    "cloudinary":      ("Cloudinary CDN",   "cloudinary","storage"),
    "socket.io":       ("WebSocket Server", "socketio",  "realtime"),
    "kafkajs":         ("Apache Kafka",     "kafka",     "broker"),
    "ioredis":         ("Redis",            "redis",     "cache"),
    "@supabase/supabase-js": ("Supabase",   "supabase",  "baas"),
    "plaid":           ("Plaid API",        "plaid",     "finance"),
    
    # Python / requirements.txt
    "boto3":           ("AWS Services",     "amazonec2", "cloud"),
    "botocore":        ("AWS Services",     "amazonec2", "cloud"),
    "openai":          ("OpenAI API",       "openai",    "llm"),
    "anthropic":       ("Anthropic Claude", "anthropic", "llm"),
    "langchain":       ("LangChain",        "langchain", "llm_framework"),
    "stripe":          ("Stripe API",       "stripe",    "payment"),
    "twilio":          ("Twilio SMS",       "twilio",    "notification"),
    "sendgrid":        ("SendGrid Email",   "sendgrid",  "notification"),
    "firebase-admin":  ("Firebase Admin",   "firebase",  "baas"),
    "celery":          ("Celery Worker",    "celery",    "task_queue"),
    "pika":            ("RabbitMQ",         "rabbitmq",  "broker"),
    "redis":           ("Redis",            "redis",     "cache"),
    "psycopg2":        ("PostgreSQL",       "postgresql","database"),
    "pymongo":         ("MongoDB",          "mongodb",   "database"),

    # Java / pom.xml
    "aws-java-sdk":    ("AWS Services",     "amazonec2", "cloud"),
    "spring-kafka":    ("Apache Kafka",     "kafka",     "broker"),
    "spring-boot-starter-data-redis": ("Redis", "redis", "cache"),
    "postgresql":      ("PostgreSQL",       "postgresql","database"),
    "mysql-connector": ("MySQL",            "mysql",     "database"),
    "mongodb":         ("MongoDB",          "mongodb",   "database"),

    # Go / go.mod
    "github.com/aws/aws-sdk-go": ("AWS Services", "amazonec2", "cloud"),
    "github.com/go-redis/redis": ("Redis", "redis", "cache"),
    "github.com/segmentio/kafka-go": ("Apache Kafka", "kafka", "broker"),
}

class DependencyScanner:
    
    @staticmethod
    def scan_all(clone_dir: str) -> list:
        """
        Returns list of detected third-party services:
        [{"id": "stripe", "name": "Stripe API", "icon": "stripe", "category": "payment"}, ...]
        """
        detected = {}
        
        DependencyScanner._scan_package_json(clone_dir, detected)
        DependencyScanner._scan_requirements_txt(clone_dir, detected)
        DependencyScanner._scan_pom_xml(clone_dir, detected)
        DependencyScanner._scan_go_mod(clone_dir, detected)

        return list(detected.values())
    
    @staticmethod
    def _add_service(detected_dict: dict, name: str, icon: str, category: str):
        svc_id = name.lower().replace(" ", "_").replace("/", "_").replace("-", "_")
        if svc_id not in detected_dict:
            detected_dict[svc_id] = {
                "id": svc_id,
                "name": name,
                "icon": icon,
                "category": category
            }

    @staticmethod
    def _scan_package_json(clone_dir: str, detected: dict):
        for root, dirs, files in os.walk(clone_dir):
            dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', 'target', 'build', 'dist'}]
            if "package.json" in files:
                full_path = os.path.join(root, "package.json")
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        data = json.load(f)
                        deps = {}
                        deps.update(data.get("dependencies", {}))
                        deps.update(data.get("devDependencies", {}))
                        
                        for pkg_name in deps.keys():
                            for target_pkg, (s_name, s_icon, s_cat) in PACKAGE_TO_SERVICE.items():
                                if pkg_name == target_pkg or pkg_name.startswith(target_pkg):
                                    DependencyScanner._add_service(detected, s_name, s_icon, s_cat)
                except Exception:
                    pass

    @staticmethod
    def _scan_requirements_txt(clone_dir: str, detected: dict):
        for root, dirs, files in os.walk(clone_dir):
            dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', 'venv', '.venv'}]
            for file in files:
                if file == "requirements.txt" or file.endswith(".req") or file == "Pipfile":
                    full_path = os.path.join(root, file)
                    try:
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            for line in f:
                                pkg_line = line.strip().lower().split("#")[0]
                                if not pkg_line:
                                    continue
                                pkg_name = pkg_line.split("==")[0].split(">=")[0].split("<=")[0].strip()
                                for target_pkg, (s_name, s_icon, s_cat) in PACKAGE_TO_SERVICE.items():
                                    if pkg_name == target_pkg:
                                        DependencyScanner._add_service(detected, s_name, s_icon, s_cat)
                    except Exception:
                        pass

    @staticmethod
    def _scan_pom_xml(clone_dir: str, detected: dict):
        for root, dirs, files in os.walk(clone_dir):
            dirs[:] = [d for d in dirs if d not in {'.git', 'target', 'build'}]
            if "pom.xml" in files or "build.gradle" in files:
                file_name = "pom.xml" if "pom.xml" in files else "build.gradle"
                full_path = os.path.join(root, file_name)
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read().lower()
                        for target_pkg, (s_name, s_icon, s_cat) in PACKAGE_TO_SERVICE.items():
                            if target_pkg in content:
                                DependencyScanner._add_service(detected, s_name, s_icon, s_cat)
                except Exception:
                    pass

    @staticmethod
    def _scan_go_mod(clone_dir: str, detected: dict):
        for root, dirs, files in os.walk(clone_dir):
            dirs[:] = [d for d in dirs if d not in {'.git', 'vendor'}]
            if "go.mod" in files:
                full_path = os.path.join(root, "go.mod")
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read().lower()
                        for target_pkg, (s_name, s_icon, s_cat) in PACKAGE_TO_SERVICE.items():
                            if target_pkg in content:
                                DependencyScanner._add_service(detected, s_name, s_icon, s_cat)
                except Exception:
                    pass
