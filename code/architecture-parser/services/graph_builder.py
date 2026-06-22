import os
import re
import json

class GraphBuilder:
    @staticmethod
    def parse_docker_compose(clone_dir: str) -> dict:
        services = {}
        compose_files = ["docker-compose.dev.yml", "docker-compose.yml"]
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
                rel_path = os.path.relpath(full_path, clone_dir).replace('\\', '/')
                indent = '  ' * (depth - 1)
                if os.path.isdir(full_path):
                    file_tree_lines.append(f"{indent}- {entry}/")
                    walk_tree(full_path, depth + 1)
                else:
                    file_tree_lines.append(f"{indent}- {entry}")

        walk_tree(clone_dir, 1)
        project_file_tree = '\n'.join(file_tree_lines)

        descriptor_files = [
            "docker-compose.yml", "docker-compose.dev.yml",
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

        services_list = []
        relations_list = []
        ai_success = False

        if gemini_api_key and gemini_api_url:
            print("Gemini API keys present, running AI system architect analysis...")
            project_file_tree, project_descriptors = GraphBuilder.get_project_summary(clone_dir)
            
            prompt = f"""You are an expert System Architect. Your task is to analyze the file structure and project configuration files of a repository to identify the high-level services/components/modules (Layer 1) and their communication relationships.

Here is the directory tree of the project (up to 3 levels deep):
{project_file_tree}

Here are the contents of the key configuration/descriptor files detected in the repository:
{project_descriptors}

Analyze this information and output a clean JSON object representing the system architecture.
Rules for matching paths:
- Identify logical modules/components/services.
- For each service, provide a list of path prefixes ("paths") that contain the files belonging to that service (e.g. ["code/frontend/"] or ["cmd/", "internal/"] or ["src/model/"]).
- IMPORTANT: The path prefixes MUST exactly match directories shown in the file tree above. Do NOT invent or hallucinate paths.
- External services (like PostgreSQL, Redis, Kafka, external APIs) must have an empty paths array `[]` UNLESS there is a specific folder in the repository dedicated to their configuration (e.g., a `db/migration` folder for postgres).
- If the repository is a simple monolith (e.g., just a single Go service, a single python model training repo), create exactly one main application service and match it to root paths like [""]. Do not assign `""` to multiple services.

Your response MUST be a pure JSON object, without markdown block wrappers like ```json.
JSON Schema to follow strictly:
{{
  "services": [
    {{
      "id": "string (lowercase, alphanumeric and underscores only, e.g. api_gateway, user_service)",
      "name": "string (friendly name, e.g. API Gateway)",
      "tech": "string (technologies used, e.g. Go (Gin))",
      "port": "string or null (default port used by the service)",
      "type": "string (one of: client, service, database, cache, broker, worker, parser, other)",
      "description": "string (short description of its role)",
      "paths": ["array of strings (relative folder path prefixes belonging to this service, e.g. ['cmd/', 'internal/'])]"
    }}
  ],
  "relations": [
    {{
      "source": "string (id of source service)",
      "target": "string (id of target service)",
      "label": "string (e.g. HTTP, REST, gRPC, Pub/Sub)"
    }}
  ]
}}"""
            import hashlib
            state_str = project_file_tree + "\n" + project_descriptors
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
                    services_list = ai_data.get("services", [])
                    relations_list = ai_data.get("relations", [])
                    if services_list:
                        # Validate and normalize paths against the real filesystem
                        valid_services = []
                        for svc in services_list:
                            valid_paths = []
                            for p in svc.get("paths", []):
                                if p == "":
                                    valid_paths.append(p)
                                    continue
                                
                                # clone_dir may be None if we are not cloning, but here it is guaranteed by architecture parser flow
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
                        print(f"Successfully loaded {len(services_list)} services and {len(relations_list)} relations from Gemini AI.")
                except Exception as e:
                    print(f"Failed to parse JSON from Gemini response: {e}. Raw text:\n{cleaned_text}")

        if not ai_success:
            print("AI analysis failed or not configured. Falling back to rule-based docker-compose parser.")
            services_map = {}
            if clone_dir:
                services_map = GraphBuilder.parse_docker_compose(clone_dir)
                
            if "frontend" not in services_map and (not clone_dir or os.path.exists(os.path.join(clone_dir, "code/frontend")) or os.path.exists(os.path.join(clone_dir, "frontend"))):
                services_map["frontend"] = {"ports": ["5173:5173"], "depends_on": ["backend"]}
            if "backend" not in services_map and (not clone_dir or os.path.exists(os.path.join(clone_dir, "code/backend")) or os.path.exists(os.path.join(clone_dir, "backend"))):
                services_map["backend"] = {"ports": ["8080:8080"], "depends_on": ["postgres", "mongodb", "redis"]}

            # If no services identified at all (e.g. monolith / non-standard structure, no AI keys)
            if not services_map:
                project_name = os.path.basename(clone_dir.strip("/\\")) if clone_dir else "monolith"
                clean_id = re.sub(r'[^a-zA-Z0-9_]', '_', project_name).lower()
                services_map[clean_id] = {"ports": [], "depends_on": [], "is_monolith": True}

            SERVICE_METADATA = {
                "frontend": {"name": "Frontend", "tech": "React (Vite)", "port": "5173", "type": "client", "paths": ["code/frontend", "frontend"]},
                "backend": {"name": "Backend", "tech": "Spring Boot (Java)", "port": "8080", "type": "service", "paths": ["code/backend", "backend"]},
                "postgres": {"name": "PostgreSQL", "tech": "Database", "port": "5432", "type": "database", "paths": []},
                "mongodb": {"name": "MongoDB", "tech": "Database", "port": "27017", "type": "database", "paths": []},
                "redis": {"name": "Redis", "tech": "Cache & Queue", "port": "6379", "type": "cache", "paths": []},
                "kafka": {"name": "Kafka", "tech": "Message Broker", "port": "9092", "type": "broker", "paths": []},
                "playwright-server": {"name": "Playwright Server", "tech": "NodeJS", "port": "4001", "type": "service", "paths": ["code/playwright-service", "playwright-service"]},
                "playwright-worker": {"name": "Playwright Worker", "tech": "NodeJS", "port": None, "type": "worker", "paths": []},
                "architecture-parser": {"name": "Architecture Parser", "tech": "FastAPI (Python)", "port": "4002", "type": "parser", "paths": ["code/architecture-parser", "architecture-parser"]}
            }

            for svc_name, svc_info in services_map.items():
                meta = SERVICE_METADATA.get(svc_name, {})
                port = meta.get("port")
                if not port and svc_info.get("ports"):
                    p_str = svc_info["ports"][0]
                    port = p_str.split(":")[0] if ":" in p_str else p_str
                    
                paths = meta.get("paths", [svc_name])
                if svc_info.get("is_monolith"):
                    paths = [""] # map all paths to the monolith service
                    
                services_list.append({
                    "id": svc_name,
                    "name": meta.get("name", svc_name.replace('_', ' ').title()),
                    "tech": meta.get("tech", "Application Monolith"),
                    "port": port,
                    "type": meta.get("type", "service"),
                    "description": f"Service {svc_name}",
                    "paths": paths
                })

            implicit_edges = [
                ("frontend", "backend", "HTTP REST"),
                ("backend", "postgres", "JDBC"),
                ("backend", "mongodb", "Spring Data"),
                ("backend", "redis", "Cache"),
                ("backend", "kafka", "Spring Kafka"),
                ("backend", "playwright-server", "HTTP Call"),
                ("backend", "architecture-parser", "HTTP Call"),
                ("playwright-worker", "playwright-server", "Websocket"),
                ("playwright-worker", "kafka", "Consumer"),
                ("architecture-parser", "redis", "Cache")
            ]
            for src, tgt, label in implicit_edges:
                if src in services_map and tgt in services_map:
                    relations_list.append({
                        "source": src,
                        "target": tgt,
                        "label": label
                    })

            for svc_name, svc_info in services_map.items():
                for dep in svc_info.get("depends_on", []):
                    if svc_name in services_map and dep in services_map:
                        if not any(r["source"] == svc_name and r["target"] == dep for r in relations_list):
                            relations_list.append({
                                "source": svc_name,
                                "target": dep,
                                "label": "depends_on"
                            })

        # Create Layer 1 Nodes in graph
        for svc in services_list:
            svc_id = svc["id"]
            svc_node = {
                "nodeId": f"service:{svc_id}",
                "name": svc.get("name", svc_id.capitalize()),
                "type": "CLASS",
                "layer": "SYSTEM",
                "parentId": None,
                "filePath": "",
                "language": "docker",
                "lineStart": None,
                "lineEnd": None,
                "metadata": {
                    "tech": svc.get("tech", "Dynamic Component"),
                    "port": svc.get("port"),
                    "serviceId": svc_id,
                    "type": svc.get("type", "service"),
                    "description": svc.get("description", "")
                },
                "riskLevel": "LOW",
                "connectionCount": 0,
                "childrenIds": []
            }
            nodes.append(svc_node)

        # Create Layer 1 Edges in graph
        for rel in relations_list:
            src = rel["source"]
            tgt = rel["target"]
            label = rel.get("label", "depends_on")
            
            src_node_id = f"service:{src}"
            tgt_node_id = f"service:{tgt}"
            
            if any(n["nodeId"] == src_node_id for n in nodes) and any(n["nodeId"] == tgt_node_id for n in nodes):
                edge_id = f"edge:service_{src}-depends_{tgt}"
                edges.append({
                    "edgeId": edge_id,
                    "source": src_node_id,
                    "target": tgt_node_id,
                    "type": "DEPENDS_ON",
                    "layer": "SYSTEM",
                    "confidence": "EXTRACTED",
                    "metadata": {"label": label}
                })

        # 2. BUILD LAYER 2 (INTERNAL STRUCTURE)
        file_nodes = []
        
        # Pre-sort and extract paths for faster mapping
        all_mappings = []
        for svc in services_list:
            for prefix in svc.get("paths", []):
                standard_prefix = prefix.replace('\\', '/').strip('/')
                all_mappings.append((standard_prefix, svc["id"]))
        all_mappings.sort(key=lambda x: len(x[0]), reverse=True)

        for raw_node in raw_nodes:
            if raw_node["type"] == "FILE":
                file_path = raw_node["filePath"]
                matched_svc_id = None
                
                for prefix, svc_id in all_mappings:
                    standard_path = file_path.replace('\\', '/')
                    if prefix == "" or standard_path.startswith(prefix + "/") or standard_path == prefix:
                        matched_svc_id = svc_id
                        break
                        
                if not matched_svc_id:
                    matched_svc_id = GraphBuilder.get_service_id(file_path)
                    if services_list and matched_svc_id not in [s["id"] for s in services_list]:
                        matched_svc_id = services_list[0]["id"]
                
                raw_node["metadata"]["serviceId"] = matched_svc_id
                raw_node["layer"] = "INTERNAL"
                file_nodes.append(raw_node)

        # Build folder nodes
        folder_nodes = {}
        for file_node in file_nodes:
            file_path = file_node["filePath"]
            svc_id = file_node["metadata"]["serviceId"]
            dir_path = os.path.dirname(file_path).replace("\\", "/")
            
            if not dir_path:
                file_node["parentId"] = None
                nodes.append(file_node)
                continue
                
            parts = dir_path.split("/")
            current_path = ""
            parent_folder_id = None
            
            for i, part in enumerate(parts):
                current_path = "/".join(parts[:i+1])
                folder_id = f"pkg:{current_path}"
                
                if folder_id not in folder_nodes:
                    folder_node = {
                        "nodeId": folder_id,
                        "name": part,
                        "type": "PACKAGE",
                        "layer": "INTERNAL",
                        "parentId": parent_folder_id,
                        "filePath": current_path + "/",
                        "language": "folder",
                        "lineStart": None,
                        "lineEnd": None,
                        "metadata": {
                            "fileCount": 0,
                            "serviceId": svc_id
                        },
                        "riskLevel": "LOW",
                        "connectionCount": 0,
                        "childrenIds": []
                    }
                    folder_nodes[folder_id] = folder_node
                    
                    if parent_folder_id:
                        edges.append({
                            "edgeId": f"edge:{parent_folder_id}-contains-{folder_id}",
                            "source": parent_folder_id,
                            "target": folder_id,
                            "type": "CONTAINS",
                            "layer": "INTERNAL",
                            "confidence": "EXTRACTED"
                        })
                        folder_nodes[parent_folder_id]["childrenIds"].append(folder_id)
                
                parent_folder_id = folder_id
                
            file_node["parentId"] = parent_folder_id
            if parent_folder_id:
                folder_nodes[parent_folder_id]["metadata"]["fileCount"] += 1
                folder_nodes[parent_folder_id]["childrenIds"].append(file_node["nodeId"])
                
                edges.append({
                    "edgeId": f"edge:{parent_folder_id}-contains-{file_node['nodeId']}",
                    "source": parent_folder_id,
                    "target": file_node["nodeId"],
                    "type": "CONTAINS",
                    "layer": "INTERNAL",
                    "confidence": "EXTRACTED"
                })
            
            nodes.append(file_node)

        nodes.extend(folder_nodes.values())

        # Resolve imports to draw edges between files
        file_map = {n["filePath"]: n for n in file_nodes}
        
        # Build index for faster suffix matching
        # Key: base filename or path suffix, Value: list of matching file nodes
        suffix_index = {}
        for path, node in file_map.items():
            path_parts = path.split('/')
            for i in range(len(path_parts)):
                suffix = '/'.join(path_parts[i:])
                suffix_index.setdefault(suffix, []).append(node)
                # Also index by dot notation for Java packages (e.g. org/example/backend/...)
                dot_suffix = suffix.replace('/', '.')
                suffix_index.setdefault(dot_suffix, []).append(node)
                # Without extension
                if '.' in suffix:
                    base_suffix = suffix.rsplit('.', 1)[0]
                    suffix_index.setdefault(base_suffix, []).append(node)
                    dot_base_suffix = base_suffix.replace('/', '.')
                    suffix_index.setdefault(dot_base_suffix, []).append(node)

        for src_node in file_nodes:
            imports = src_node["metadata"].get("imports", [])
            src_svc = src_node["metadata"]["serviceId"]
            
            for imp in imports:
                target_node = None
                
                # Check for relative import (JS/TS mostly)
                if imp.startswith('.') or imp.startswith('..'):
                    resolved_path = GraphBuilder.resolve_relative_path(src_node["filePath"], imp)
                    # Try with common extensions
                    for ext in ['', '.js', '.jsx', '.ts', '.tsx']:
                        test_path = resolved_path + ext
                        if test_path in file_map:
                            target_node = file_map[test_path]
                            break
                else:
                    # Java import or TS alias/absolute import
                    # Clean Java import
                    cleaned_imp = imp.split(' as ')[0].split(' import ')[0].strip()
                    # Try suffix match
                    matches = suffix_index.get(cleaned_imp)
                    if not matches and cleaned_imp.endswith('.*'):
                        # Wildcard java import, try parent package match
                        parent_pkg = cleaned_imp[:-2]
                        # Find any file that is in this package
                        for path, node in file_map.items():
                            if parent_pkg in path.replace('/', '.'):
                                target_node = node
                                break
                    elif matches:
                        # Find match in same service first, else first match
                        service_matches = [m for m in matches if m["metadata"]["serviceId"] == src_svc]
                        target_node = service_matches[0] if service_matches else matches[0]

                if target_node and target_node["nodeId"] != src_node["nodeId"]:
                    edge_id = f"edge:{src_node['nodeId']}-imports-{target_node['nodeId']}"
                    if not any(e["edgeId"] == edge_id for e in edges):
                        edges.append({
                            "edgeId": edge_id,
                            "source": src_node["nodeId"],
                            "target": target_node["nodeId"],
                            "type": "IMPORTS",
                            "layer": "INTERNAL",
                            "confidence": "EXTRACTED",
                            "metadata": {}
                        })

        # Calculate metrics for file and folder nodes
        connection_counts = {node["nodeId"]: 0 for node in nodes}
        for edge in edges:
            src = edge["source"]
            tgt = edge["target"]
            if src in connection_counts:
                connection_counts[src] += 1
            if tgt in connection_counts:
                connection_counts[tgt] += 1

        god_nodes = []
        for node in nodes:
            nid = node["nodeId"]
            conn_count = connection_counts.get(nid, 0)
            node["connectionCount"] = conn_count
            
            if node["type"] == "PACKAGE":
                if conn_count >= 15:
                    node["riskLevel"] = "CRITICAL"
                elif conn_count >= 10:
                    node["riskLevel"] = "HIGH"
                elif conn_count >= 5:
                    node["riskLevel"] = "MEDIUM"
                else:
                    node["riskLevel"] = "LOW"
            elif node["type"] == "FILE":
                if conn_count >= 8:
                    node["riskLevel"] = "HIGH"
                elif conn_count >= 4:
                    node["riskLevel"] = "MEDIUM"
                else:
                    node["riskLevel"] = "LOW"

            if node["type"] in ("FILE", "PACKAGE") and conn_count >= 10:
                god_nodes.append({
                    "nodeId": nid,
                    "name": node["name"],
                    "type": node["type"],
                    "connections": conn_count
                })

        stats["totalNodes"] = len(nodes)
        stats["totalEdges"] = len(edges)
        stats["godNodes"] = sorted(god_nodes, key=lambda x: x["connections"], reverse=True)[:10]

        return nodes, edges, stats

    @staticmethod
    def resolve_relative_path(current_file_path: str, import_path: str) -> str:
        curr_dir = os.path.dirname(current_file_path)
        joined = os.path.join(curr_dir, import_path)
        normalized = os.path.normpath(joined).replace("\\", "/")
        return normalized

