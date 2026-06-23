import os
import re
import json
import hashlib

class GraphBuilder:
    @staticmethod
    def parse_docker_compose(clone_dir: str) -> dict:
        services = {}
        compose_files = ["docker-compose.yaml", "docker-compose.yml", "docker-compose.dev.yml"]
        compose_path = None
        
        for file_name in compose_files:
            path = os.path.join(clone_dir, file_name)
            if os.path.exists(path):
                compose_path = path
                break
                
        if not compose_path:
            return {}
            
        current_service = None
        current_key = None
        in_services = False
        
        try:
            with open(compose_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    val_line = line.split('#')[0]
                    stripped = val_line.strip()
                    if not stripped:
                        continue
                    
                    indent = len(line) - len(line.lstrip())
                    
                    if indent == 0:
                        if stripped.startswith('services:'):
                            in_services = True
                        else:
                            in_services = False
                        continue
                    
                    if in_services:
                        if indent == 2 and stripped.endswith(':'):
                            current_service = stripped[:-1].strip()
                            services[current_service] = {
                                "ports": [],
                                "depends_on": []
                            }
                            current_key = None
                        elif current_service and indent == 4:
                            if stripped.endswith(':'):
                                current_key = stripped[:-1].strip()
                            elif ':' in stripped:
                                k, v = stripped.split(':', 1)
                                k = k.strip()
                                v = v.strip().strip('"\'')
                                if k == 'ports':
                                    pass
                        elif current_service and indent >= 6:
                            if current_key == 'ports' and (stripped.startswith('-') or stripped.startswith('"') or stripped.startswith("'")):
                                port_str = stripped.lstrip('- ').strip('"\'')
                                services[current_service]["ports"].append(port_str)
                            elif current_key == 'depends_on' and (stripped.startswith('-') or stripped.startswith('"') or stripped.startswith("'")):
                                dep_str = stripped.lstrip('- ').strip('"\'')
                                services[current_service]["depends_on"].append(dep_str)
        except Exception as e:
            print(f"Error parsing docker-compose: {e}")
            
        return services

    @staticmethod
    def parse_github_workflows(clone_dir: str) -> dict:
        workflows = {}
        workflows_path = os.path.join(clone_dir, ".github", "workflows")
        if os.path.exists(workflows_path) and os.path.isdir(workflows_path):
            try:
                for file_name in os.listdir(workflows_path):
                    if file_name.endswith(".yml") or file_name.endswith(".yaml"):
                        full_path = os.path.join(workflows_path, file_name)
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                        
                        jobs = []
                        current_job = None
                        steps = []
                        
                        lines = content.split('\n')
                        for line in lines:
                            stripped = line.strip()
                            if not stripped:
                                continue
                            
                            # Simple job detection
                            if line.startswith('  ') and line[2].isalnum() and stripped.endswith(':'):
                                if current_job:
                                    jobs.append({"name": current_job, "steps": steps})
                                current_job = stripped[:-1].strip()
                                steps = []
                            elif current_job and stripped.startswith('- name:'):
                                step_name = stripped[7:].strip().strip('"\'')
                                steps.append(step_name)
                                
                        if current_job:
                            jobs.append({"name": current_job, "steps": steps})
                            
                        tools = []
                        if "sonar" in content.lower():
                            tools.append("SonarCloud")
                        if "trivy" in content.lower():
                            tools.append("Trivy")
                        if "ghcr.io" in content.lower() or "github container registry" in content.lower():
                            tools.append("GHCR")
                        if "appleboy/ssh-action" in content or "ssh" in content.lower() or "ec2" in content.lower():
                            tools.append("AWS EC2 Deploy")
                        if "telegram" in content.lower():
                            tools.append("Telegram Alert")
                            
                        workflows[file_name] = {
                            "jobs": jobs,
                            "tools_detected": tools
                        }
            except Exception as e:
                print(f"Error parsing workflows: {e}")
        return workflows

    @staticmethod
    def parse_dockerfiles(clone_dir: str) -> list:
        dockerfiles = []
        try:
            for root, dirs, files in os.walk(clone_dir):
                dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', 'target', 'build', 'dist', 'venv', '.venv'}]
                for file in files:
                    if file == "Dockerfile" or file.endswith(".dockerfile"):
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, clone_dir).replace('\\', '/')
                        
                        base_image = "unknown"
                        exposed_ports = []
                        
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            for line in f:
                                stripped = line.strip()
                                if stripped.startswith("FROM "):
                                    base_image = stripped[5:].strip()
                                elif stripped.startswith("EXPOSE "):
                                    exposed_ports.append(stripped[7:].strip())
                                    
                        dockerfiles.append({
                            "path": rel_path,
                            "base_image": base_image,
                            "exposed_ports": exposed_ports
                        })
        except Exception as e:
            print(f"Error parsing dockerfiles: {e}")
        return dockerfiles

    @staticmethod
    def scan_env_references(clone_dir: str) -> list:
        detected = []
        env_files = [".env.example", ".env"]
        for file_name in env_files:
            path = os.path.join(clone_dir, file_name)
            if os.path.exists(path):
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    if "GRAFANA" in content:
                        detected.append("Grafana Cloud")
                    if "PLAID" in content:
                        detected.append("Plaid API")
                    if "TELEGRAM" in content:
                        detected.append("Telegram Bot API")
                    if "STRIPE" in content:
                        detected.append("Stripe API")
                    if "AWS" in content:
                        detected.append("AWS Services")
                    if "SENDGRID" in content:
                        detected.append("SendGrid")
                except Exception as e:
                    print(f"Error reading env file: {e}")
                break
        return list(set(detected))

    @staticmethod
    def get_service_id(rel_path: str) -> str:
        parts = rel_path.split('/')
        if not parts:
            return 'other'
        if parts[0] == 'code' and len(parts) > 1:
            return parts[1]
        return parts[0]

    @staticmethod
    def get_project_summary(clone_dir: str) -> tuple[str, str]:
        file_tree_lines = []
        ignored_dirs = {'.git', 'node_modules', '.venv', 'venv', '__pycache__', '.idea', '.settings', 'target', 'bin', 'build', 'dist', 'out'}
        
        def walk_tree(current_dir, depth):
            if depth > 3:
                return
            try:
                entries = sorted(os.listdir(current_dir))
            except Exception:
                return
            for entry in entries:
                if entry in ignored_dirs:
                    continue
                full_path = os.path.join(current_dir, entry)
                indent = '  ' * (depth - 1)
                if os.path.isdir(full_path):
                    file_tree_lines.append(f"{indent}- {entry}/")
                    walk_tree(full_path, depth + 1)
                else:
                    file_tree_lines.append(f"{indent}- {entry}")

        walk_tree(clone_dir, 1)
        project_file_tree = '\n'.join(file_tree_lines)

        descriptor_files = [
            "docker-compose.yml", "docker-compose.yaml", "docker-compose.dev.yml",
            "package.json", "go.mod", "pom.xml", "build.gradle",
            "requirements.txt", "setup.py", "pyproject.toml", "Cargo.toml",
            "README.md"
        ]
        
        descriptors_content = []
        for root, dirs, files in os.walk(clone_dir):
            dirs[:] = [d for d in dirs if d not in ignored_dirs]
            for file in files:
                if file in descriptor_files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, clone_dir).replace('\\', '/')
                    try:
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            lines = [f.readline() for _ in range(100)]
                            content = ''.join([line for line in lines if line])
                            descriptors_content.append(f"--- File: {rel_path} ---\n{content}\n")
                    except Exception as e:
                        print(f"Error reading {rel_path}: {e}")
                        
        project_descriptors = '\n'.join(descriptors_content)
        return project_file_tree, project_descriptors

    @staticmethod
    def call_gemini_api(api_key: str, api_url: str, prompt: str) -> str:
        import httpx
        url = f"{api_url}?key={api_key}" if "?key=" not in api_url else api_url
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "topK": 1
            }
        }
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    resp_json = response.json()
                    candidates = resp_json.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        return text
                print(f"Gemini API returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
        return ""

    @staticmethod
    def clean_json_output(response: str) -> str:
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        elif response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        response = response.strip()
        
        first_brace = response.find('{')
        last_brace = response.rfind('}')
        if first_brace >= 0 and last_brace >= 0 and last_brace > first_brace:
            response = response[first_brace:last_brace + 1]
            
        return response

    @staticmethod
    def build_graph(raw_nodes: list, raw_edges: list, stats: dict, clone_dir: str = None, gemini_api_key: str = None, gemini_api_url: str = None) -> tuple[list, list, dict]:
        nodes = []
        edges = []

        infra_groups = []
        services_list = []
        relations_list = []
        ai_success = False

        # Gather advanced environment context
        workflows = GraphBuilder.parse_github_workflows(clone_dir) if clone_dir else {}
        dockerfiles = GraphBuilder.parse_dockerfiles(clone_dir) if clone_dir else []
        env_refs = GraphBuilder.scan_env_references(clone_dir) if clone_dir else []

        infra_context_lines = []
        if workflows:
            infra_context_lines.append("GitHub Workflows Detected:")
            for wf_name, wf_info in workflows.items():
                tools_str = ", ".join(wf_info["tools_detected"]) if wf_info["tools_detected"] else "None"
                infra_context_lines.append(f"  - Workflow: {wf_name}")
                infra_context_lines.append(f"    Tools/Integrations detected: {tools_str}")
                for job in wf_info.get("jobs", []):
                    steps_str = " -> ".join(job["steps"][:5])
                    infra_context_lines.append(f"    Job '{job['name']}': {steps_str}")
        if dockerfiles:
            infra_context_lines.append("\nDockerfiles Detected:")
            for df in dockerfiles:
                ports_str = ", ".join(df["exposed_ports"]) if df["exposed_ports"] else "None"
                infra_context_lines.append(f"  - Path: {df['path']}, Base Image: {df['base_image']}, Exposed Ports: {ports_str}")
        if env_refs:
            infra_context_lines.append("\nExternal services referenced in environment variables:")
            for ref in env_refs:
                infra_context_lines.append(f"  - {ref}")
                
        infra_context = "\n".join(infra_context_lines)

        if gemini_api_key and gemini_api_url:
            print("Gemini API keys present, running V2 nested infrastructure architect analysis...")
            project_file_tree, project_descriptors = GraphBuilder.get_project_summary(clone_dir)
            
            prompt = f"""You are an expert System Architect. Your task is to analyze the repository structure, Dockerfiles, Docker Compose configuration, GitHub CI/CD workflows, and environment variables to construct a detailed runtime system architecture map with nested infrastructure grouping.

Here is the directory tree of the project (up to 3 levels deep):
{project_file_tree}

Here are the key descriptor and configuration files:
{project_descriptors}

Here are the details from GitHub workflows, Dockerfiles, and environment variables:
{infra_context}

Analyze this information and output a clean JSON object representing the system architecture.
Rules for Nesting and Groups:
1. Detect or create logical infrastructure groups (`infrastructure_groups`) to represent the runtime and deployment environments:
   - CI_CD: Build, test, scan, and deploy pipelines (e.g. GitHub Actions, Jenkins).
   - CLOUD_INSTANCE: The host VM/server where containers run (e.g. AWS EC2, DigitalOcean Droplet, GCP VM).
   - CONTAINER_CLUSTER: Container orchestrators running on the host (e.g. Docker Compose, Kubernetes cluster).
   - MONITORING: Bounding box for observability/metrics collections (e.g. Prometheus, Node Exporter, cAdvisor, PostgreSQL Exporter). This should be nested inside CONTAINER_CLUSTER or CLOUD_INSTANCE.
   - EXTERNAL: Third-party APIs, SaaS, or remote services called over the Internet (e.g. Plaid API, Telegram Bot API, Let's Encrypt, Grafana Cloud).
2. Establish nesting relationships using `parentGroup`. For example, Docker Compose (`CONTAINER_CLUSTER`) runs inside AWS EC2 (`CLOUD_INSTANCE`), and the Monitoring Stack (`MONITORING`) runs inside Docker Compose.
3. Assign each runtime service/component (excluding the groups themselves) to its corresponding infrastructure group via the `group` field (referencing the group's `id`).
4. For each service, provide an `icon` field representing the technology brand logo. Choose a lowercase key from common technologies, e.g.: "react", "springboot", "postgresql", "redis", "nginx", "docker", "githubactions", "sonarcloud", "trivy", "prometheus", "grafana", "amazonec2", "telegram", "letsencrypt", "python", "fastapi", "nodejs", "mongodb", "kafka", "java", "golang".
5. For each service, specify `paths` that contain the source code files. External services must have an empty paths array `[]`.
6. Identify the connection protocol for relations (e.g., "HTTP/REST", "JDBC", "gRPC", "AMQP", "WebSocket", "SSH Deploy", "remote_write", "scrape", etc.) and place it in the "protocol" field.

Your response MUST be a pure JSON object, without markdown block wrappers like ```json.
JSON Schema to follow strictly:
{{
  "infrastructure_groups": [
    {{
      "id": "string (lowercase, alphanumeric and underscores only, e.g. aws_ec2, docker_compose, monitoring_stack)",
      "name": "string (friendly name, e.g. AWS EC2 Instance, Monitoring Stack)",
      "groupType": "string (one of: CI_CD, CLOUD_INSTANCE, CONTAINER_CLUSTER, MONITORING, EXTERNAL)",
      "tech": "string or null (e.g. AWS EC2, Docker Compose, Prometheus Stack)",
      "icon": "string or null (logo key)",
      "parentGroup": "string or null (id of parent group if nested, e.g. aws_ec2)"
    }}
  ],
  "services": [
    {{
      "id": "string (lowercase, alphanumeric and underscores only, e.g. frontend, backend, database)",
      "name": "string (friendly name, e.g. Frontend App)",
      "tech": "string (technologies used, e.g. React (Vite), Spring Boot, PostgreSQL)",
      "icon": "string (logo key)",
      "port": "string or null (default port used)",
      "type": "string (one of: client, service, database, cache, broker, worker, parser, other)",
      "group": "string or null (id of the group it belongs to)",
      "description": "string",
      "paths": ["array of strings (relative folder path prefixes)"]
    }}
  ],
  "relations": [
    {{
      "source": "string (id of source service)",
      "target": "string (id of target service)",
      "protocol": "string (the connection protocol/label)"
    }}
  ]
}}"""
            import hashlib
            state_str = project_file_tree + "\n" + project_descriptors + "\n" + infra_context
            state_hash = hashlib.md5(state_str.encode('utf-8')).hexdigest()
            
            cache_dir = os.path.join(os.path.dirname(__file__), '..', '.cache', 'ai_responses')
            os.makedirs(cache_dir, exist_ok=True)
            cache_file = os.path.join(cache_dir, f"{state_hash}.json")
            
            cleaned_text = None
            if os.path.exists(cache_file):
                print(f"Cache hit! Using cached AI response from {cache_file}")
                with open(cache_file, 'r', encoding='utf-8') as f:
                    cleaned_text = f.read()
            else:
                response_text = GraphBuilder.call_gemini_api(gemini_api_key, gemini_api_url, prompt)
                if response_text:
                    cleaned_text = GraphBuilder.clean_json_output(response_text)
                    with open(cache_file, 'w', encoding='utf-8') as f:
                        f.write(cleaned_text)

            if cleaned_text:
                try:
                    ai_data = json.loads(cleaned_text)
                    infra_groups = ai_data.get("infrastructure_groups", [])
                    services_list = ai_data.get("services", [])
                    relations_list = ai_data.get("relations", [])
                    
                    if services_list:
                        valid_services = []
                        for svc in services_list:
                            valid_paths = []
                            for p in svc.get("paths", []):
                                if p == "":
                                    valid_paths.append(p)
                                    continue
                                
                                full_p = os.path.join(clone_dir, p) if clone_dir else p
                                if clone_dir and os.path.exists(full_p):
                                    valid_paths.append(p)
                                elif not clone_dir:
                                    valid_paths.append(p)
                                else:
                                    print(f"Dropping hallucinated path: {p} for service {svc['id']}")
                                    
                            svc["paths"] = valid_paths
                            valid_services.append(svc)
                            
                        services_list = valid_services
                        ai_success = True
                        print(f"Successfully loaded {len(infra_groups)} groups, {len(services_list)} services, and {len(relations_list)} relations.")
                except Exception as e:
                    print(f"Failed to parse JSON from Gemini response: {e}. Raw text:\n{cleaned_text}")

        if not ai_success:
            print("AI analysis failed or not configured. Falling back to rule-based parser.")
            services_map = {}
            if clone_dir:
                services_map = GraphBuilder.parse_docker_compose(clone_dir)
                
            if "frontend" not in services_map and (not clone_dir or os.path.exists(os.path.join(clone_dir, "code/frontend")) or os.path.exists(os.path.join(clone_dir, "frontend"))):
                services_map["frontend"] = {"ports": ["5173:5173"], "depends_on": ["backend"]}
            if "backend" not in services_map and (not clone_dir or os.path.exists(os.path.join(clone_dir, "code/backend")) or os.path.exists(os.path.join(clone_dir, "backend"))):
                services_map["backend"] = {"ports": ["8080:8080"], "depends_on": ["postgres"]}
            
            # Setup default groups
            infra_groups = [
                {"id": "cicd_pipeline", "name": "CI/CD Pipeline", "groupType": "CI_CD", "tech": "GitHub Actions", "icon": "githubactions", "parentGroup": None},
                {"id": "aws_ec2", "name": "AWS EC2 Instance", "groupType": "CLOUD_INSTANCE", "tech": "AWS EC2", "icon": "amazonec2", "parentGroup": None},
                {"id": "docker_compose", "name": "Docker Compose", "groupType": "CONTAINER_CLUSTER", "tech": "Docker Compose", "icon": "docker", "parentGroup": "aws_ec2"},
                {"id": "monitoring_stack", "name": "Monitoring Stack", "groupType": "MONITORING", "tech": "Prometheus Stack", "icon": "prometheus", "parentGroup": "docker_compose"},
                {"id": "external_services", "name": "External Services", "groupType": "EXTERNAL", "tech": "Third-party APIs", "icon": "cloud", "parentGroup": None}
            ]

            SERVICE_METADATA = {
                "frontend": {"name": "Frontend", "tech": "React (Vite)", "port": "5173", "type": "client", "group": "docker_compose", "icon": "react", "paths": ["code/frontend", "frontend"]},
                "backend": {"name": "Backend", "tech": "Spring Boot (Java)", "port": "8080", "type": "service", "group": "docker_compose", "icon": "springboot", "paths": ["code/backend", "backend"]},
                "database": {"name": "PostgreSQL", "tech": "PostgreSQL Database", "port": "5432", "type": "database", "group": "docker_compose", "icon": "postgresql", "paths": []},
                "postgres": {"name": "PostgreSQL", "tech": "PostgreSQL Database", "port": "5432", "type": "database", "group": "docker_compose", "icon": "postgresql", "paths": []},
                "mongodb": {"name": "MongoDB", "tech": "Database", "port": "27017", "type": "database", "group": "docker_compose", "icon": "mongodb", "paths": []},
                "redis": {"name": "Redis", "tech": "Cache & Queue", "port": "6379", "type": "cache", "group": "docker_compose", "icon": "redis", "paths": []},
                "kafka": {"name": "Kafka", "tech": "Message Broker", "port": "9092", "type": "broker", "group": "docker_compose", "icon": "kafka", "paths": []},
                
                # Monitoring Services
                "prometheus": {"name": "Prometheus", "tech": "Metrics Server", "port": "9090", "type": "service", "group": "monitoring_stack", "icon": "prometheus", "paths": []},
                "node-exporter": {"name": "Node Exporter", "tech": "Host Metrics", "port": "9100", "type": "worker", "group": "monitoring_stack", "icon": "prometheus", "paths": []},
                "cadvisor": {"name": "cAdvisor", "tech": "Container Metrics", "port": "8080", "type": "worker", "group": "monitoring_stack", "icon": "docker", "paths": []},
                "postgres-exporter": {"name": "Postgres Exporter", "tech": "DB Metrics", "port": "9187", "type": "worker", "group": "monitoring_stack", "icon": "postgresql", "paths": []},
                "grafana": {"name": "Grafana", "tech": "SaaS Dashboard", "port": None, "type": "service", "group": "external_services", "icon": "grafana", "paths": []},
                
                # External APIs
                "plaid": {"name": "Plaid API", "tech": "Bank Integration", "port": None, "type": "external", "group": "external_services", "icon": "plaid", "paths": []},
                "telegram": {"name": "Telegram Bot API", "tech": "Alerts & Notifications", "port": None, "type": "external", "group": "external_services", "icon": "telegram", "paths": []},
                "letsencrypt": {"name": "Let's Encrypt", "tech": "SSL Certificates", "port": None, "type": "external", "group": "external_services", "icon": "letsencrypt", "paths": []},
                
                # CI/CD services
                "github-actions": {"name": "GitHub Actions", "tech": "CI/CD runner", "port": None, "type": "other", "group": "cicd_pipeline", "icon": "githubactions", "paths": []},
                "sonarcloud": {"name": "SonarCloud", "tech": "Code Quality Scan", "port": None, "type": "other", "group": "cicd_pipeline", "icon": "sonarcloud", "paths": []},
                "trivy": {"name": "Trivy Scan", "tech": "Vulnerability Scan", "port": None, "type": "other", "group": "cicd_pipeline", "icon": "trivy", "paths": []}
            }

            for svc_name, svc_info in services_map.items():
                meta = SERVICE_METADATA.get(svc_name, {})
                port = meta.get("port")
                if not port and svc_info.get("ports"):
                    p_str = svc_info["ports"][0]
                    port = p_str.split(":")[0] if ":" in p_str else p_str
                    
                paths = meta.get("paths", [svc_name])
                
                grp = meta.get("group")
                if not grp:
                    name_lower = svc_name.lower()
                    if "exporter" in name_lower or "prometheus" in name_lower or "grafana" in name_lower or "cadvisor" in name_lower or "monitoring" in name_lower:
                        grp = "monitoring_stack"
                    elif "plaid" in name_lower or "telegram" in name_lower or "stripe" in name_lower or "letsencrypt" in name_lower or "external" in name_lower or "certbot" in name_lower:
                        grp = "external_services"
                    elif "sonar" in name_lower or "trivy" in name_lower or "github" in name_lower or "action" in name_lower:
                        grp = "cicd_pipeline"
                    else:
                        grp = "docker_compose"

                services_list.append({
                    "id": svc_name,
                    "name": meta.get("name", svc_name.replace('_', ' ').title()),
                    "tech": meta.get("tech", "Container Service"),
                    "icon": meta.get("icon", svc_name.split("-")[0].split("_")[0]),
                    "port": port,
                    "type": meta.get("type", "service"),
                    "group": grp,
                    "description": f"Service {svc_name}",
                    "paths": paths
                })

            has_workflows = os.path.exists(os.path.join(clone_dir, ".github", "workflows")) if clone_dir else False
            if has_workflows:
                services_list.append({
                    "id": "github_actions",
                    "name": "GitHub Actions",
                    "tech": "CI/CD Platform",
                    "icon": "githubactions",
                    "port": None,
                    "type": "other",
                    "group": "cicd_pipeline",
                    "description": "CI/CD workflow runners",
                    "paths": []
                })
                services_list.append({
                    "id": "sonarcloud",
                    "name": "SonarCloud",
                    "tech": "SAAS Code Analysis",
                    "icon": "sonarcloud",
                    "port": None,
                    "type": "other",
                    "group": "cicd_pipeline",
                    "description": "Quality gate & security checks",
                    "paths": []
                })
                services_list.append({
                    "id": "trivy",
                    "name": "Trivy",
                    "tech": "Container Security",
                    "icon": "trivy",
                    "port": None,
                    "type": "other",
                    "group": "cicd_pipeline",
                    "description": "Vulnerability scanning",
                    "paths": []
                })
                relations_list.extend([
                    {"source": "github_actions", "target": "sonarcloud", "protocol": "Code Quality Scan"},
                    {"source": "github_actions", "target": "trivy", "protocol": "Vulnerability Scan"},
                    {"source": "github_actions", "target": "backend", "protocol": "SSH Deploy"}
                ])
                
            # If env references exist, add them
            env_detected = GraphBuilder.scan_env_references(clone_dir) if clone_dir else []
            for item in env_detected:
                item_id = item.lower().replace(" ", "_").replace("api", "").strip("_")
                if item_id == "plaid":
                    if not any(s["id"] == "plaid" for s in services_list):
                        services_list.append({
                            "id": "plaid", "name": "Plaid API", "tech": "Finance SaaS", "icon": "plaid",
                            "port": None, "type": "external", "group": "external_services", "description": "Bank API integration", "paths": []
                        })
                    relations_list.append({"source": "backend", "target": "plaid", "protocol": "Plaid API"})
                elif item_id == "telegram_bot":
                    if not any(s["id"] == "telegram" for s in services_list):
                        services_list.append({
                            "id": "telegram", "name": "Telegram Bot API", "tech": "Notification SaaS", "icon": "telegram",
                            "port": None, "type": "external", "group": "external_services", "description": "Deploy & alert channels", "paths": []
                        })
                    relations_list.append({"source": "backend", "target": "telegram", "protocol": "Alert Notification"})
                elif item_id == "grafana_cloud":
                    if not any(s["id"] == "grafana" for s in services_list):
                        services_list.append({
                            "id": "grafana", "name": "Grafana Cloud", "tech": "SaaS Dashboard", "icon": "grafana",
                            "port": None, "type": "external", "group": "external_services", "description": "Metrics visualization", "paths": []
                        })
                    relations_list.append({"source": "prometheus", "target": "grafana", "protocol": "remote_write"})

            implicit_edges = [
                ("frontend", "backend", "HTTP REST"),
                ("backend", "postgres", "JDBC"),
                ("backend", "database", "JDBC"),
                ("backend", "mongodb", "Spring Data"),
                ("backend", "redis", "Cache"),
                ("backend", "kafka", "Spring Kafka"),
                ("prometheus", "backend", "scrape"),
                ("prometheus", "node-exporter", "scrape"),
                ("prometheus", "cadvisor", "scrape"),
                ("prometheus", "postgres-exporter", "scrape"),
                ("postgres-exporter", "postgres", "JDBC"),
                ("postgres-exporter", "database", "JDBC")
            ]
            for src, tgt, label in implicit_edges:
                if any(s["id"] == src for s in services_list) and any(s["id"] == tgt for s in services_list):
                    if not any(r["source"] == src and r["target"] == tgt for r in relations_list):
                        relations_list.append({
                            "source": src,
                            "target": tgt,
                            "protocol": label
                        })

        # 1. Output Group Nodes
        for grp in infra_groups:
            grp_id = grp["id"]
            parent_id = f"group:{grp['parentGroup']}" if grp.get("parentGroup") else None
            
            grp_node = {
                "nodeId": f"group:{grp_id}",
                "name": grp.get("name", grp_id.capitalize()),
                "type": "INFRA_GROUP",
                "layer": "SYSTEM",
                "parentId": parent_id,
                "filePath": "",
                "language": "infra",
                "lineStart": None,
                "lineEnd": None,
                "metadata": {
                    "groupType": grp.get("groupType"),
                    "tech": grp.get("tech"),
                    "icon": grp.get("icon")
                },
                "riskLevel": "LOW",
                "connectionCount": 0,
                "childrenIds": []
            }
            nodes.append(grp_node)

        # 2. Output Service Nodes
        for svc in services_list:
            svc_id = svc["id"]
            parent_id = f"group:{svc['group']}" if svc.get("group") else None
            
            svc_node = {
                "nodeId": f"service:{svc_id}",
                "name": svc.get("name", svc_id.capitalize()),
                "type": "CLASS",
                "layer": "SYSTEM",
                "parentId": parent_id,
                "filePath": "",
                "language": "docker",
                "lineStart": None,
                "lineEnd": None,
                "metadata": {
                    "tech": svc.get("tech", "Dynamic Component"),
                    "port": svc.get("port"),
                    "serviceId": svc_id,
                    "type": svc.get("type", "service"),
                    "icon": svc.get("icon"),
                    "description": svc.get("description", "")
                },
                "riskLevel": "LOW",
                "connectionCount": 0,
                "childrenIds": []
            }
            nodes.append(svc_node)

        # Build connections and hierarchy references
        node_map = {n["nodeId"]: n for n in nodes}
        for n in nodes:
            p_id = n.get("parentId")
            if p_id and p_id in node_map:
                node_map[p_id]["childrenIds"].append(n["nodeId"])

        # 3. Create Layer 1 Edges in graph
        for rel in relations_list:
            src = rel["source"]
            tgt = rel["target"]
            protocol = rel.get("protocol", rel.get("label", "depends_on"))
            
            src_node_id = f"service:{src}"
            tgt_node_id = f"service:{tgt}"
            
            if src_node_id in node_map and tgt_node_id in node_map:
                edge_id = f"edge:service_{src}-depends_{tgt}"
                edges.append({
                    "edgeId": edge_id,
                    "source": src_node_id,
                    "target": tgt_node_id,
                    "type": "DEPENDS_ON",
                    "layer": "SYSTEM",
                    "confidence": "EXTRACTED",
                    "metadata": {"label": protocol}
                })

        # Populate connection count
        for edge in edges:
            src = edge["source"]
            tgt = edge["target"]
            if src in node_map:
                node_map[src]["connectionCount"] += 1
            if tgt in node_map:
                node_map[tgt]["connectionCount"] += 1

        stats["totalNodes"] = len(nodes)
        stats["totalEdges"] = len(edges)
        stats["godNodes"] = []

        return nodes, edges, stats

    @staticmethod
    def resolve_relative_path(current_file_path: str, import_path: str) -> str:
        curr_dir = os.path.dirname(current_file_path)
        joined = os.path.join(curr_dir, import_path)
        normalized = os.path.normpath(joined).replace("\\", "/")
        return normalized
