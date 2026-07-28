import os
import re
import json
import hashlib
from services.diagram_vision_check import DiagramVisionChecker
from services.repo_classifier import RepoClassifier
from services.dependency_scanner import DependencyScanner

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
            "README.md", "dbt_project.yml", "Chart.yaml", "ansible.cfg"
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
    def _validate_paths_flexible(clone_dir: str, paths: list) -> list:
        if not clone_dir:
            return paths
        valid = []
        for p in paths:
            if not p:
                valid.append("")
                continue
            normalized = p.strip("/").replace("\\", "/")
            candidate = os.path.join(clone_dir, normalized)
            if os.path.exists(candidate):
                valid.append(p)
            else:
                first_seg = normalized.split("/")[0]
                try:
                    top_entries = os.listdir(clone_dir)
                    matched = any(e.lower().startswith(first_seg.lower()) for e in top_entries)
                    if matched:
                        valid.append(p)
                    else:
                        print(f"Dropping unverifiable path: {p}")
                except Exception:
                    valid.append(p)
        return valid

    @staticmethod
    def _build_minimal_fallback(repo_type: str, signals: dict, third_party: list, clone_dir: str = None) -> tuple[list, list, list]:
        enclosures = []
        workloads = []
        connections = []
        
        compose_services = GraphBuilder.parse_docker_compose(clone_dir) if clone_dir else {}

        if repo_type == "WEB_CONTAINERIZED" and compose_services:
            enclosures.append({
                "id": "docker_compose",
                "name": "Docker Compose Runtime",
                "type": "CONTAINER_CLUSTER",
                "tech": "Docker Compose",
                "icon": "docker",
                "parentId": None
            })
            for s_name in compose_services.keys():
                workloads.append({
                    "id": s_name,
                    "name": s_name.replace("_", " ").replace("-", " ").title(),
                    "type": "service",
                    "tech": "Container Service",
                    "icon": s_name.split("-")[0].split("_")[0],
                    "port": compose_services[s_name]["ports"][0] if compose_services[s_name]["ports"] else None,
                    "enclosureId": "docker_compose",
                    "description": f"{s_name} workload container",
                    "paths": [s_name]
                })
                for dep in compose_services[s_name]["depends_on"]:
                    connections.append({
                        "from": s_name,
                        "to": dep,
                        "protocol": "depends_on",
                        "label": "Depends On"
                    })
        elif repo_type == "LOCAL_MONOLITH_WEB":
            lang = signals.get("primary_language", "code")
            frameworks = signals.get("detected_frameworks", [])
            fw_label = frameworks[0].title() if frameworks else lang.title()
            enclosures.append({
                "id": "local_runtime",
                "name": f"Local Runtime ({fw_label})",
                "type": "LOCAL_RUNTIME",
                "tech": fw_label,
                "icon": lang,
                "parentId": None
            })
            # Folder-based layer decomposition for Monolith
            layers = GraphBuilder._detect_monolith_layers(clone_dir, lang)
            if layers:
                prev_id = None
                for layer in layers:
                    workloads.append({
                        "id": layer["id"],
                        "name": layer["name"],
                        "type": layer["type"],
                        "tech": layer["tech"],
                        "icon": lang,
                        "port": None,
                        "enclosureId": "local_runtime",
                        "description": layer["desc"],
                        "paths": layer["paths"]
                    })
                    if prev_id:
                        connections.append({
                            "from": prev_id, "to": layer["id"],
                            "protocol": "Method Call", "label": "calls"
                        })
                    prev_id = layer["id"]
            else:
                workloads.append({
                    "id": "app_core",
                    "name": fw_label + " Application",
                    "type": "service",
                    "tech": fw_label,
                    "icon": lang,
                    "port": None,
                    "enclosureId": "local_runtime",
                    "description": "Core application module",
                    "paths": ["src", "app"]
                })

        # ── 3. LOCAL_STANDALONE_APP ──────────────────────────────────────────
        elif repo_type == "LOCAL_STANDALONE_APP":
            lang = signals.get("primary_language", "code")
            enclosures.append({
                "id": "local_machine",
                "name": "Local Machine",
                "type": "LOCAL_RUNTIME",
                "tech": lang.title(),
                "icon": lang,
                "parentId": None
            })
            modules = GraphBuilder._detect_top_level_modules(clone_dir, max_nodes=5)
            if modules:
                for i, mod in enumerate(modules):
                    workloads.append({
                        "id": mod["id"],
                        "name": mod["name"],
                        "type": "service",
                        "tech": lang.title(),
                        "icon": lang,
                        "port": None,
                        "enclosureId": "local_machine",
                        "description": f"Module: {mod['name']}",
                        "paths": [mod["path"]]
                    })
                    if i > 0:
                        connections.append({
                            "from": modules[0]["id"], "to": mod["id"],
                            "protocol": "Import", "label": "imports"
                        })
            else:
                workloads.append({
                    "id": "app_engine",
                    "name": lang.title() + " App",
                    "type": "service",
                    "tech": lang.title(),
                    "icon": lang,
                    "port": None,
                    "enclosureId": "local_machine",
                    "description": "Standalone application",
                    "paths": ["src", "main"]
                })

        # ── 4. AI_DATA_PIPELINE ──────────────────────────────────────────────
        elif repo_type == "AI_DATA_PIPELINE":
            enclosures.append({
                "id": "ai_pipeline_env",
                "name": "Python AI / Data Environment",
                "type": "PIPELINE_STAGE",
                "tech": "Python AI Stack",
                "icon": "python",
                "parentId": None
            })
            ai_modules = GraphBuilder._detect_ai_pipeline_modules(clone_dir)
            if ai_modules:
                prev_id = None
                for mod in ai_modules:
                    workloads.append({
                        "id": mod["id"],
                        "name": mod["name"],
                        "type": mod["type"],
                        "tech": mod["tech"],
                        "icon": "python",
                        "port": None,
                        "enclosureId": "ai_pipeline_env",
                        "description": mod["desc"],
                        "paths": mod["paths"]
                    })
                    if prev_id:
                        connections.append({
                            "from": prev_id, "to": mod["id"],
                            "protocol": "pipeline", "label": "→"
                        })
                    prev_id = mod["id"]
            else:
                workloads.append({
                    "id": "model_pipeline",
                    "name": "Data & Model Pipeline",
                    "type": "worker",
                    "tech": "Python AI Stack",
                    "icon": "python",
                    "port": None,
                    "enclosureId": "ai_pipeline_env",
                    "description": "AI model training and inference pipeline",
                    "paths": ["notebooks", "models", "src"]
                })

        # ── 5. SECURITY_IA_TOOL ──────────────────────────────────────────────
        elif repo_type == "SECURITY_IA_TOOL":
            lang = signals.get("primary_language", "python")
            enclosures.append({
                "id": "sec_tool_env",
                "name": "Security Tool Runtime",
                "type": "LOCAL_RUNTIME",
                "tech": "CLI Security Tool",
                "icon": lang,
                "parentId": None
            })
            # External zone for the attack target
            enclosures.append({
                "id": "target_zone",
                "name": "Attack Target",
                "type": "EXTERNAL_ZONE",
                "tech": "Remote System",
                "icon": "cloud",
                "parentId": None
            })
            # Target node (external)
            workloads.append({
                "id": "target_system",
                "name": "Target Web / DB",
                "type": "external",
                "tech": "HTTP / SQL endpoint",
                "icon": "cloud",
                "port": "80/443",
                "enclosureId": "target_zone",
                "description": "Remote target system being audited or tested",
                "paths": []
            })

            sec_modules = GraphBuilder._detect_security_modules(clone_dir, lang)

            # ── Re-order: ensure Core Engine is always first (hub node)
            HUB_NAMES = {"core engine", "core", "engine", "scanner / fuzzer"}
            hub_mods = [m for m in sec_modules if m["name"].lower() in HUB_NAMES]
            non_hub  = [m for m in sec_modules if m["name"].lower() not in HUB_NAMES]
            ordered_mods = hub_mods + non_hub

            if ordered_mods:
                hub_id = ordered_mods[0]["id"]   # Core Engine (or first found)
                for mod in ordered_mods:
                    workloads.append({
                        "id": mod["id"],
                        "name": mod["name"],
                        "type": mod["type"],
                        "tech": mod["tech"],
                        "icon": lang,
                        "port": None,
                        "enclosureId": "sec_tool_env",
                        "description": mod["desc"],
                        "paths": mod["paths"]
                    })

                # ── Star topology: all non-hub modules → Core Engine (hub)
                for mod in ordered_mods[1:]:
                    connections.append({
                        "from": mod["id"],
                        "to": hub_id,
                        "protocol": "Method Call",
                        "label": "feeds"
                    })

                # ── Core Engine → Target system (the attack)
                connections.append({
                    "from": hub_id,
                    "to": "target_system",
                    "protocol": "Network / Low-level",
                    "label": "attacks / audits"
                })
            else:
                # minimal fallback
                workloads.append({
                    "id": "sec_engine",
                    "name": "Core Engine",
                    "type": "scanner",
                    "tech": lang.title(),
                    "icon": lang,
                    "port": None,
                    "enclosureId": "sec_tool_env",
                    "description": "Core security tool engine",
                    "paths": ["lib", "core", "src"]
                })
                connections.append({
                    "from": "sec_engine",
                    "to": "target_system",
                    "protocol": "Network / Low-level",
                    "label": "attacks / audits"
                })

        # ── 6. DEVOPS_IAC ────────────────────────────────────────────────────
        elif repo_type == "DEVOPS_IAC":
            enclosures.append({
                "id": "iac_env",
                "name": "Infrastructure as Code",
                "type": "CLOUD",
                "tech": "Terraform / Kubernetes / Ansible",
                "icon": "terraform",
                "parentId": None
            })
            iac_modules = GraphBuilder._detect_iac_modules(clone_dir)
            if iac_modules:
                for mod in iac_modules:
                    workloads.append({
                        "id": mod["id"],
                        "name": mod["name"],
                        "type": mod["type"],
                        "tech": mod["tech"],
                        "icon": mod["icon"],
                        "port": None,
                        "enclosureId": "iac_env",
                        "description": mod["desc"],
                        "paths": mod["paths"]
                    })
            else:
                workloads.append({
                    "id": "iac_config",
                    "name": "IaC Configuration",
                    "type": "other",
                    "tech": "Terraform / Kubernetes",
                    "icon": "terraform",
                    "port": None,
                    "enclosureId": "iac_env",
                    "description": "Infrastructure configuration definitions",
                    "paths": ["."]
                })

        # ── External Third-Party APIs ─────────────────────────────────────────
        if third_party and workloads:
            enclosures.append({
                "id": "external_zone",
                "name": "External Third-Party APIs",
                "type": "EXTERNAL_ZONE",
                "tech": "Cloud SaaS",
                "icon": "cloud",
                "parentId": None
            })
            # Find the primary "service" workload to link from
            main_wl = next(
                (w["id"] for w in workloads if w.get("type") in ["service", "client", "worker"]),
                workloads[0]["id"]
            )
            for tp in third_party:
                tp_id = tp["id"]
                workloads.append({
                    "id": tp_id,
                    "name": tp["name"],
                    "type": "external",
                    "tech": tp["category"].title(),
                    "icon": tp["icon"],
                    "port": None,
                    "enclosureId": "external_zone",
                    "description": f"External {tp['name']} API Integration",
                    "paths": []
                })
                connections.append({
                    "from": main_wl, "to": tp_id,
                    "protocol": "HTTPS/REST", "label": tp["category"].title()
                })

        return enclosures, workloads, connections

    # ── Folder-based Decomposition Helpers ────────────────────────────────────

    @staticmethod
    def _detect_monolith_layers(clone_dir: str, lang: str) -> list:
        """Detect architectural layers from folder structure for Monolith Web apps."""
        if not clone_dir:
            return []
        layers = []

        # Java / Spring Boot: scan for DDD-style package names
        if lang == "java":
            java_layer_patterns = [
                ("controller", "Web Controller Layer", "client", "Handles HTTP requests"),
                ("service", "Business Service Layer", "service", "Core business logic"),
                ("repository", "Data Repository Layer", "database", "Database access layer"),
                ("model", "Domain Model", "other", "Entity and domain objects"),
                ("entity", "Domain Entities", "other", "JPA entity definitions"),
                ("config", "Configuration", "other", "Application configuration"),
            ]
            found_paths = {}
            for root, dirs, files in os.walk(clone_dir):
                dirs[:] = [d for d in dirs if d not in {'.git', 'target', 'build', 'test', 'tests'}]
                folder_name = os.path.basename(root).lower()
                rel = os.path.relpath(root, clone_dir).replace("\\", "/")
                for pattern, name, w_type, desc in java_layer_patterns:
                    if folder_name == pattern and pattern not in found_paths:
                        found_paths[pattern] = rel
            ordered = ["controller", "service", "repository", "model"]
            for pat in ordered:
                if pat in found_paths:
                    layers.append({
                        "id": f"layer_{pat}",
                        "name": {"controller": "Web Controller", "service": "Service Layer",
                                  "repository": "Repository Layer", "model": "Domain Model"}.get(pat, pat.title()),
                        "type": {"controller": "client", "service": "service",
                                  "repository": "database", "model": "other"}.get(pat, "service"),
                        "tech": f"Spring Boot ({pat.title()})",
                        "desc": f"Handles {pat} responsibilities",
                        "paths": [found_paths[pat]]
                    })

        # Python: detect common module folders
        elif lang == "python":
            py_patterns = [
                (["routes", "views", "api", "endpoints", "controllers"], "API / Routes", "client", "HTTP request handlers"),
                (["services", "service", "usecases", "use_cases"], "Service Layer", "service", "Business logic"),
                (["models", "model", "schemas", "entities"], "Data Models", "database", "Data schema definitions"),
                (["db", "database", "repositories", "repo"], "Data Access", "database", "Database layer"),
                (["utils", "helpers", "common"], "Utilities", "other", "Shared utilities"),
            ]
            try:
                top_dirs = {d.lower(): d for d in os.listdir(clone_dir)
                            if os.path.isdir(os.path.join(clone_dir, d))
                            and d not in {'.git', 'venv', '.venv', '__pycache__', 'tests', 'test', 'docs', 'node_modules'}}
                for candidates, name, w_type, desc in py_patterns:
                    for cand in candidates:
                        if cand in top_dirs:
                            layers.append({
                                "id": f"layer_{cand}",
                                "name": name,
                                "type": w_type,
                                "tech": f"Python ({top_dirs[cand]})",
                                "desc": desc,
                                "paths": [top_dirs[cand]]
                            })
                            break
            except Exception:
                pass

        # Node.js / TypeScript
        elif lang in ["javascript", "typescript"]:
            js_patterns = [
                (["routes", "controllers", "api", "handlers"], "Route / Controller", "client", "HTTP request handlers"),
                (["services", "usecases"], "Service Layer", "service", "Business logic"),
                (["models", "schemas", "entities"], "Data Models", "database", "Data definitions"),
                (["middleware"], "Middleware", "other", "Request interceptors"),
                (["utils", "helpers", "lib"], "Utilities", "other", "Shared utilities"),
            ]
            try:
                top_dirs = {d.lower(): d for d in os.listdir(clone_dir)
                            if os.path.isdir(os.path.join(clone_dir, d))
                            and d not in {'.git', 'node_modules', 'dist', 'build', 'test', 'tests', 'docs'}}
                for candidates, name, w_type, desc in js_patterns:
                    for cand in candidates:
                        if cand in top_dirs:
                            layers.append({
                                "id": f"layer_{cand}",
                                "name": name,
                                "type": w_type,
                                "tech": f"Node.js ({top_dirs[cand]})",
                                "desc": desc,
                                "paths": [top_dirs[cand]]
                            })
                            break
            except Exception:
                pass

        return layers[:5]  # Cap at 5 layers max

    @staticmethod
    def _detect_top_level_modules(clone_dir: str, max_nodes: int = 5) -> list:
        """Detect meaningful top-level module folders for LOCAL_STANDALONE_APP."""
        if not clone_dir:
            return []
        IGNORE_DIRS = {'.git', 'node_modules', 'venv', '.venv', '__pycache__',
                       'build', 'dist', 'out', 'target', 'test', 'tests', 'docs',
                       '.idea', '.vscode', 'assets', 'resources', 'static'}
        try:
            entries = sorted(os.listdir(clone_dir))
        except Exception:
            return []
        modules = []
        for entry in entries:
            if entry.lower() in IGNORE_DIRS or entry.startswith("."):
                continue
            full_path = os.path.join(clone_dir, entry)
            if os.path.isdir(full_path):
                modules.append({
                    "id": entry.lower().replace("-", "_").replace(" ", "_"),
                    "name": entry.replace("_", " ").replace("-", " ").title(),
                    "path": entry
                })
            if len(modules) >= max_nodes:
                break
        return modules

    @staticmethod
    def _detect_ai_pipeline_modules(clone_dir: str) -> list:
        """Detect AI pipeline stages from folder structure."""
        if not clone_dir:
            return []
        AI_MODULE_MAP = [
            (["data", "dataset", "datasets", "raw_data", "ingest", "ingestion"], "Data Ingestor", "worker", "Data ingestion and loading"),
            (["preprocessing", "preprocess", "etl", "transform", "feature"], "Feature Engineering", "worker", "Data preprocessing and feature extraction"),
            (["train", "training", "model", "models", "experiment"], "Model Training", "worker", "Model training and experimentation"),
            (["eval", "evaluate", "evaluation", "metrics"], "Evaluation", "worker", "Model evaluation and metrics"),
            (["inference", "predict", "serve", "serving", "api", "app"], "Inference / Serving", "service", "Model serving and inference API"),
            (["notebooks", "notebook"], "Research Notebooks", "other", "Jupyter notebooks for exploration"),
            (["pipelines", "pipeline", "workflow", "airflow", "dags"], "Pipeline Orchestrator", "scheduler", "DAG/workflow orchestration"),
            (["vectorstore", "embeddings", "index"], "Vector Store / Embeddings", "database", "Vector database for embeddings"),
        ]
        try:
            top_dirs = {d.lower(): d for d in os.listdir(clone_dir)
                        if os.path.isdir(os.path.join(clone_dir, d))
                        and d not in {'.git', 'venv', '.venv', '__pycache__', 'tests', 'test', 'docs', 'node_modules', '.github'}}
        except Exception:
            return []
        modules = []
        seen_names = set()
        for candidates, name, w_type, desc in AI_MODULE_MAP:
            for cand in candidates:
                if cand in top_dirs and name not in seen_names:
                    mod_id = name.lower().replace(" ", "_").replace("/", "_")
                    modules.append({
                        "id": mod_id,
                        "name": name,
                        "type": w_type,
                        "tech": "Python",
                        "desc": desc,
                        "paths": [top_dirs[cand]]
                    })
                    seen_names.add(name)
                    break
        return modules[:6]

    @staticmethod
    def _detect_security_modules(clone_dir: str, lang: str) -> list:
        """Detect security tool modules from folder structure."""
        if not clone_dir:
            return []
        SEC_MODULE_MAP = [
            (["lib/core", "core", "engine"], "Core Engine", "scanner", "Main scanning engine"),
            (["lib/parse", "lib/parser", "parse", "parser"], "Target Parser", "scanner", "Parses target specs and responses"),
            (["lib/request", "request", "network"], "Network Module", "service", "Handles network requests"),
            (["tamper", "bypass", "evasion"], "WAF Bypass / Tamper Scripts", "scanner", "Payload obfuscation and WAF evasion"),
            (["plugins", "plugin", "modules", "connectors"], "Plugin / Connector Layer", "other", "Database and service connectors"),
            (["scanner", "scan", "fuzz", "fuzzer"], "Scanner / Fuzzer", "scanner", "Active scanning and fuzzing engine"),
            (["report", "reports", "output"], "Report Generator", "reporter", "Generates audit reports"),
            (["exploits", "exploit", "payloads", "payload"], "Exploit / Payload Module", "scanner", "Exploit payloads and delivery"),
        ]
        IGNORE_DIRS = {'.git', '__pycache__', 'venv', '.venv', 'test', 'tests', 'docs', 'build', 'dist'}
        try:
            all_paths = set()
            for root, dirs, _ in os.walk(clone_dir):
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
                rel = os.path.relpath(root, clone_dir).replace("\\", "/")
                if rel != ".":
                    all_paths.add(rel.lower())
        except Exception:
            return []
        modules = []
        seen = set()
        for candidates, name, w_type, desc in SEC_MODULE_MAP:
            for cand in candidates:
                if cand in all_paths and name not in seen:
                    mod_id = name.lower().replace(" ", "_").replace("/", "_")
                    modules.append({
                        "id": mod_id,
                        "name": name,
                        "type": w_type,
                        "tech": lang.title(),
                        "desc": desc,
                        "paths": [cand]
                    })
                    seen.add(name)
                    break
        return modules[:6]

    @staticmethod
    def _detect_iac_modules(clone_dir: str) -> list:
        """Detect IaC modules from Terraform/K8s/Ansible structure."""
        if not clone_dir:
            return []
        IAC_MAP = [
            (["k8s", "kubernetes", "k8s-specifications", "manifests", "deploy"], "K8s Manifests", "other", "Kubernetes deployment manifests", "kubernetes"),
            (["helm", "charts", "chart"], "Helm Charts", "other", "Helm chart templates", "helm"),
            (["terraform", "tf", "infra", "infrastructure"], "Terraform Infrastructure", "other", "Cloud infrastructure definitions", "terraform"),
            (["ansible", "playbooks", "roles"], "Ansible Playbooks", "other", "Configuration management playbooks", "ansible"),
            (["ci", ".github", ".gitlab-ci.yml", "jenkins"], "CI/CD Pipeline", "other", "Continuous integration pipelines", "githubactions"),
            (["monitoring", "prometheus", "grafana", "observability"], "Monitoring Stack", "service", "Metrics and observability setup", "prometheus"),
        ]
        IGNORE_DIRS = {'.git', 'node_modules', 'vendor', '.terraform', 'docs'}
        try:
            dirs_set = set()
            files_set = set()
            for root, dirs, files in os.walk(clone_dir):
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
                for d in dirs:
                    rel = os.path.relpath(os.path.join(root, d), clone_dir).replace("\\", "/")
                    dirs_set.add(rel.lower())
                for f in files:
                    files_set.add(f.lower())
        except Exception:
            return []
        modules = []
        seen = set()
        for candidates, name, w_type, desc, icon in IAC_MAP:
            for cand in candidates:
                if (cand in dirs_set or cand in files_set) and name not in seen:
                    mod_id = name.lower().replace(" ", "_").replace("/", "_")
                    modules.append({
                        "id": mod_id,
                        "name": name,
                        "type": w_type,
                        "tech": icon.title(),
                        "icon": icon,
                        "desc": desc,
                        "paths": [cand]
                    })
                    seen.add(name)
                    break
        return modules[:6]

    @staticmethod
    def build_graph(raw_nodes: list, raw_edges: list, stats: dict, clone_dir: str = None, gemini_api_key: str = None, gemini_api_url: str = None) -> tuple[list, list, dict]:
        nodes = []
        edges = []

        # 1. Run Signal Matrix classification
        classification = RepoClassifier.classify(clone_dir) if clone_dir else {
            "repo_type": "WEB_CONTAINERIZED", "confidence": "LOW", "evidence_files": [], "signals": {}
        }
        repo_type = classification["repo_type"]
        signals = classification["signals"]
        evidence = classification["evidence_files"]

        # 2. Scan third party dependencies
        third_party_services = DependencyScanner.scan_all(clone_dir) if clone_dir else []
        tp_names = [tp["name"] for tp in third_party_services]

        # 3. Gather advanced environment context
        workflows = GraphBuilder.parse_github_workflows(clone_dir) if clone_dir else {}
        dockerfiles = GraphBuilder.parse_dockerfiles(clone_dir) if clone_dir else []

        infra_context_lines = []
        if workflows:
            infra_context_lines.append("GitHub Workflows Detected:")
            for wf_name, wf_info in workflows.items():
                tools_str = ", ".join(wf_info["tools_detected"]) if wf_info["tools_detected"] else "None"
                infra_context_lines.append(f"  - Workflow: {wf_name}, Tools detected: {tools_str}")
        if dockerfiles:
            infra_context_lines.append("\nDockerfiles Detected:")
            for df in dockerfiles:
                ports_str = ", ".join(df["exposed_ports"]) if df["exposed_ports"] else "None"
                infra_context_lines.append(f"  - Path: {df['path']}, Base Image: {df['base_image']}, Exposed Ports: {ports_str}")
        if third_party_services:
            infra_context_lines.append("\nDetected Third-Party SaaS / API Dependencies:")
            for tp in third_party_services:
                infra_context_lines.append(f"  - {tp['name']} (Category: {tp['category']})")
                
        infra_context = "\n".join(infra_context_lines)

        ai_success = False
        enclosures = []
        workloads = []
        connections = []

        if gemini_api_key and gemini_api_url and clone_dir:
            print(f"Running Signal-Matrix AI System Architecture analysis for repo_type={repo_type}...")
            project_file_tree, project_descriptors = GraphBuilder.get_project_summary(clone_dir)
            
            signals_summary = f"""
- Repo Type: {repo_type} (Confidence: {classification['confidence']})
- Evidence files found: {', '.join(evidence)}
- Primary language: {signals.get('primary_language', 'unknown')}
- Detected frameworks: {', '.join(signals.get('detected_frameworks', []))}
- Detected third-party APIs: {', '.join(tp_names)}
- Has Docker Compose: {signals.get('has_compose', False)}
- Has K8s Manifests: {signals.get('has_k8s_manifests', False)}
- Has Terraform / IaC: {signals.get('has_tf_files', False)}
- Has CI/CD: {signals.get('has_ci_cd', False)} (tools: {', '.join(signals.get('ci_tools', []))})
"""

            prompt = f"""You are a Senior System Architect specialized in reading source code repositories
and producing accurate Level-1 System Context diagrams (C4 Model Level 1/2 style).
Your ONLY job is to analyze the provided repository signals and output a valid JSON
architecture map. You must NEVER invent components, technologies, or infrastructure
that have no evidence in the repository.

REPOSITORY CLASSIFICATION:
Repo Type: {repo_type}
Confidence: {classification['confidence']}
Evidence files found: {evidence}
Detected signals summary:
{signals_summary}

RAW REPOSITORY DATA:
Directory Tree (3 levels):
{project_file_tree}

Key Descriptor Files Content:
{project_descriptors}

Infrastructure Signal Details:
{infra_context}

OUTPUT RULES BY REPO TYPE:
IF repo_type == "WEB_CONTAINERIZED":
  - Outermost enclosure SHOULD be host/cloud ONLY IF cloud deploy evidence exists in workflows/descriptors.
  - Second level: Container cluster (Docker Compose)
  - Include CI/CD pipeline enclosure if .github/workflows/ detected

IF repo_type == "DEVOPS_IAC":
  - Map K8s: Enclosures = Cluster > Namespace. Workloads = Deployments/Services.
  - Map Terraform: Enclosures = Cloud Account > VPC. Workloads = Managed Resources.

IF repo_type == "AI_DATA_PIPELINE":
  - Enclosures: [Data Source Zone] -> [Processing / Training Zone] -> [Serving Zone]
  - Workloads: data_ingestor, model_trainer, experiment_tracker, inference_api, orchestrator

IF repo_type == "SECURITY_IA_TOOL":
  - Enclosures: [Operator / Client] -> [Tool Engine] -> [Target Scope]
  - Workloads: scanner, fuzzer, exploit_module, reporter

IF repo_type == "LOCAL_MONOLITH_WEB":
  ⚠️ CRITICAL CONSTRAINT: DO NOT draw Docker, Kubernetes, or Cloud enclosures unless explicit evidence exists.
  - Outermost enclosure: "Local Machine / Runtime" (e.g. JVM, Node.js, Python Runtime)
  - Draw: [Client / Browser] -> [Web Monolith Application] -> [Database] -> [External APIs]

IF repo_type == "LOCAL_STANDALONE_APP":
  ⚠️ CRITICAL CONSTRAINT: DO NOT draw Docker, Cloud, or Web concepts.
  - Outermost enclosure: "Local Machine"
  - Typical flow: [User / CLI Input] -> [App Core Engine] -> [Local Storage / Output]

ANTI-HALLUCINATION RULES:
1. Every enclosure and workload MUST have evidence from the repo.
2. If no cloud deploy evidence -> NO cloud enclosure.
3. If no docker-compose.yml -> NO Docker Compose enclosure.
4. Paths: Use relative folder prefixes that actually exist in the file tree.
5. External services: ONLY include if found in dependency manifests or explicit config.

JSON OUTPUT SCHEMA (Return ONLY valid JSON):
{{
  "repo_type": "{repo_type}",
  "enclosures": [
    {{
      "id": "lowercase_id",
      "name": "Human Readable Name",
      "type": "CLOUD | CONTAINER_CLUSTER | NETWORK | K8S_CLUSTER | K8S_NAMESPACE | LOCAL_RUNTIME | CI_CD | EXTERNAL_ZONE | MONITORING | PIPELINE_STAGE | CUSTOM",
      "tech": "Technology Name or null",
      "icon": "icon_slug or null",
      "parentId": "parent_id or null"
    }}
  ],
  "workloads": [
    {{
      "id": "lowercase_id",
      "name": "Human Readable Name",
      "type": "client | service | database | cache | broker | worker | agent | scanner | model | storage | gateway | scheduler | reporter | other",
      "tech": "Technology Used",
      "icon": "icon_slug",
      "port": "port_string or null",
      "enclosureId": "parent_enclosure_id or null",
      "description": "Short description",
      "paths": ["relative folder path prefixes"]
    }}
  ],
  "connections": [
    {{
      "from": "workload_id",
      "to": "workload_id",
      "protocol": "HTTP/REST | JDBC | gRPC | AMQP | WebSocket | SSH | scrape | CLI pipe | stdio | TCP",
      "label": "Short label or null"
    }}
  ]
}}"""

            state_str = repo_type + "\n" + project_file_tree + "\n" + project_descriptors + "\n" + infra_context
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
                    enclosures = ai_data.get("enclosures", [])
                    workloads = ai_data.get("workloads", [])
                    connections = ai_data.get("connections", [])
                    
                    if workloads:
                        for w in workloads:
                            w["paths"] = GraphBuilder._validate_paths_flexible(clone_dir, w.get("paths", []))
                        ai_success = True
                        print(f"Successfully loaded {len(enclosures)} enclosures, {len(workloads)} workloads, and {len(connections)} connections.")
                except Exception as e:
                    print(f"Failed to parse JSON from Gemini response: {e}. Raw text:\n{cleaned_text}")

        if not ai_success:
            print(f"AI analysis failed or not configured. Generating minimal evidence-based fallback for repo_type={repo_type}")
            enclosures, workloads, connections = GraphBuilder._build_minimal_fallback(
                repo_type, signals, third_party_services, clone_dir
            )

        # Track how this diagram was generated
        stats["analysisMethod"] = "AI" if ai_success else "RULE_BASED"
        stats["repoType"] = repo_type
        stats["classifierConfidence"] = classification.get("confidence", "LOW")

        # 4. Map Enclosures to INFRA_GROUP Nodes
        for enc in enclosures:
            enc_id = enc["id"]
            parent_id = f"group:{enc['parentId']}" if enc.get("parentId") else None
            nodes.append({
                "nodeId": f"group:{enc_id}",
                "name": enc.get("name", enc_id.capitalize()),
                "type": "INFRA_GROUP",
                "layer": "SYSTEM",
                "parentId": parent_id,
                "filePath": "",
                "language": "infra",
                "lineStart": None,
                "lineEnd": None,
                "metadata": {
                    "groupType": enc.get("type"),
                    "tech": enc.get("tech"),
                    "icon": enc.get("icon")
                },
                "riskLevel": "LOW",
                "connectionCount": 0,
                "childrenIds": []
            })

        # 5. Map Workloads to CLASS Nodes
        for w in workloads:
            w_id = w["id"]
            parent_id = f"group:{w['enclosureId']}" if w.get("enclosureId") else None
            nodes.append({
                "nodeId": f"service:{w_id}",
                "name": w.get("name", w_id.capitalize()),
                "type": "CLASS",
                "layer": "SYSTEM",
                "parentId": parent_id,
                "filePath": "",
                "language": "docker",
                "lineStart": None,
                "lineEnd": None,
                "metadata": {
                    "tech": w.get("tech", "Dynamic Component"),
                    "port": w.get("port"),
                    "serviceId": w_id,
                    "type": w.get("type", "service"),
                    "icon": w.get("icon"),
                    "description": w.get("description", ""),
                    "paths": w.get("paths", [])
                },
                "riskLevel": "LOW",
                "connectionCount": 0,
                "childrenIds": []
            })

        # Build hierarchy references
        node_map = {n["nodeId"]: n for n in nodes}
        for n in nodes:
            p_id = n.get("parentId")
            if p_id and p_id in node_map:
                node_map[p_id]["childrenIds"].append(n["nodeId"])

        # 6. Map Connections to Edges
        for conn in connections:
            src = conn.get("from") or conn.get("source")
            tgt = conn.get("to") or conn.get("target")
            protocol = conn.get("label") or conn.get("protocol", "depends_on")
            
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

        try:
            checker = DiagramVisionChecker(api_key=gemini_api_key, api_url=gemini_api_url)
            hints = checker.check_and_fix(nodes, edges, stats)
            stats["layoutHints"] = hints
        except Exception as e:
            print(f"Error running Vision AI density analysis: {e}")
            stats["layoutHints"] = {"extra_padding": 0, "extra_edge_spacing": 0, "extra_node_spacing": 0}

        return nodes, edges, stats

    @staticmethod
    def resolve_relative_path(current_file_path: str, import_path: str) -> str:
        curr_dir = os.path.dirname(current_file_path)
        joined = os.path.join(curr_dir, import_path)
        normalized = os.path.normpath(joined).replace("\\", "/")
        return normalized
