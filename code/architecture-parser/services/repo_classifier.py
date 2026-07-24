import os
import re

class RepoClassifier:
    
    @staticmethod
    def classify(clone_dir: str) -> dict:
        """
        Classifies the repository into one of 6 repo types using lightweight heuristics:
        1. DEVOPS_IAC
        2. WEB_CONTAINERIZED
        3. AI_DATA_PIPELINE
        4. SECURITY_IA_TOOL
        5. LOCAL_MONOLITH_WEB
        6. LOCAL_STANDALONE_APP
        
        Returns:
          {
            "repo_type": str,
            "confidence": "HIGH" | "MEDIUM" | "LOW",
            "evidence_files": list[str],
            "signals": dict
          }
        """
        tree_info = RepoClassifier._scan_file_tree(clone_dir)
        files_set = tree_info["files_set"]
        file_ext_counts = tree_info["file_ext_counts"]
        top_dirs = tree_info["top_dirs"]

        # Collect evidence & signals
        evidence_files = []
        signals = {
            "has_compose": False,
            "compose_services": [],
            "has_k8s_manifests": False,
            "has_tf_files": False,
            "has_notebooks": False,
            "has_dockerfile_count": 0,
            "has_ci_cd": False,
            "ci_tools": [],
            "detected_frameworks": [],
            "detected_databases": [],
            "detected_third_party": [],
            "primary_language": RepoClassifier._detect_primary_language(file_ext_counts),
            "runtime_enclosure_hint": None
        }

        # 1. Check Compose
        compose_files = ["docker-compose.yml", "docker-compose.yaml", "docker-compose.dev.yml", "docker-compose.prod.yml"]
        compose_path = None
        for cf in compose_files:
            if cf in files_set:
                compose_path = cf
                evidence_files.append(cf)
                signals["has_compose"] = True
                break
        
        # 2. Count Dockerfiles
        dockerfiles = [f for f in files_set if f.endswith("Dockerfile") or f.endswith(".dockerfile") or f == "Dockerfile"]
        signals["has_dockerfile_count"] = len(dockerfiles)
        if dockerfiles:
            evidence_files.extend(dockerfiles[:3])

        # 3. Check K8s Manifests
        k8s_files = RepoClassifier._detect_k8s_manifests(clone_dir, files_set)
        if k8s_files:
            signals["has_k8s_manifests"] = True
            evidence_files.extend(k8s_files[:3])

        # 4. Check Terraform / IaC
        tf_files = [f for f in files_set if f.endswith(".tf") or f.endswith(".tfvars")]
        if tf_files:
            signals["has_tf_files"] = True
            evidence_files.extend(tf_files[:3])

        # 5. Check Notebooks
        notebooks = [f for f in files_set if f.endswith(".ipynb")]
        if notebooks:
            signals["has_notebooks"] = True
            evidence_files.extend(notebooks[:3])

        # 6. Check CI/CD
        workflows_dir = os.path.join(clone_dir, ".github", "workflows")
        if os.path.exists(workflows_dir) and os.path.isdir(workflows_dir):
            try:
                wfs = [f for f in os.listdir(workflows_dir) if f.endswith((".yml", ".yaml"))]
                if wfs:
                    signals["has_ci_cd"] = True
                    signals["ci_tools"].append("github-actions")
                    evidence_files.append(f".github/workflows/{wfs[0]}")
            except Exception:
                pass
        if "Jenkinsfile" in files_set:
            signals["has_ci_cd"] = True
            signals["ci_tools"].append("jenkins")
            evidence_files.append("Jenkinsfile")

        # Now evaluate priority rules
        
        # Priority 1: DEVOPS_IAC
        if signals["has_tf_files"] or signals["has_k8s_manifests"] or "Chart.yaml" in files_set or "ansible.cfg" in files_set:
            if "Chart.yaml" in files_set:
                evidence_files.append("Chart.yaml")
            if "ansible.cfg" in files_set:
                evidence_files.append("ansible.cfg")
            signals["runtime_enclosure_hint"] = "k8s_cluster" if signals["has_k8s_manifests"] else "cloud_iac"
            return {
                "repo_type": "DEVOPS_IAC",
                "confidence": "HIGH",
                "evidence_files": list(set(evidence_files)),
                "signals": signals
            }

        # Priority 2: WEB_CONTAINERIZED
        if signals["has_compose"] or signals["has_dockerfile_count"] >= 2:
            signals["runtime_enclosure_hint"] = "docker_compose"
            return {
                "repo_type": "WEB_CONTAINERIZED",
                "confidence": "HIGH",
                "evidence_files": list(set(evidence_files)),
                "signals": signals
            }

        # Check Python / JS manifests for AI or Security or Web
        descriptors = RepoClassifier._scan_descriptors_content(clone_dir, files_set)
        for fw in descriptors["frameworks"]:
            signals["detected_frameworks"].append(fw)

        # Priority 3: AI_DATA_PIPELINE
        ai_keywords = {"torch", "tensorflow", "keras", "sklearn", "scikit-learn", "mlflow",
                       "airflow", "langchain", "openai", "transformers", "pandas", "huggingface",
                       "sentence-transformers", "chromadb", "pinecone", "weaviate", "faiss",
                       "anthropic", "cohere", "tiktoken", "llamaindex", "llama-index",
                       "datasets", "accelerate", "peft", "trl", "diffusers", "lightgbm", "xgboost"}
        ai_folder_signals = {"notebooks", "models", "model", "training", "train", "inference",
                              "embeddings", "vectorstore", "pipelines", "dags", "experiments"}
        has_ai_folder = any(d in ai_folder_signals for d in top_dirs)
        has_ai_dep = any(k in descriptors["deps"] for k in ai_keywords)
        if signals["has_notebooks"] or has_ai_dep or has_ai_folder or "dbt_project.yml" in files_set:
            if "dbt_project.yml" in files_set:
                evidence_files.append("dbt_project.yml")
            signals["runtime_enclosure_hint"] = "python_pipeline"
            return {
                "repo_type": "AI_DATA_PIPELINE",
                "confidence": "HIGH" if (signals["has_notebooks"] or has_ai_dep) else "MEDIUM",
                "evidence_files": list(set(evidence_files)),
                "signals": signals
            }

        # Priority 4: SECURITY_IA_TOOL
        sec_keywords = {"scapy", "impacket", "pwntools", "paramiko", "nmap", "python-nmap",
                        "gopacket", "shodan", "requests-html", "mechanize", "pymetasploit3",
                        "ldap3", "certipy", "bloodhound", "sqlmap"}
        sec_folder_signals = {"tamper", "exploits", "payloads", "scanner", "recon",
                               "plugins", "extra", "waf", "bypass", "bruteforce", "fuzz"}
        # Structural heuristic: Python repo with lib/ AND (tamper/ OR plugins/ OR waf/) → security CLI tool
        has_sec_structure = (
            signals["primary_language"] == "python"
            and "lib" in top_dirs
            and any(d in sec_folder_signals for d in top_dirs)
        )
        has_sec_dep = any(k in descriptors["deps"] for k in sec_keywords)
        has_sec_folder = any(d in sec_folder_signals for d in top_dirs)
        if has_sec_dep or has_sec_structure or (has_sec_folder and signals["primary_language"] == "python"):
            signals["runtime_enclosure_hint"] = "local_runtime"
            return {
                "repo_type": "SECURITY_IA_TOOL",
                "confidence": "HIGH" if (has_sec_dep or has_sec_structure) else "MEDIUM",
                "evidence_files": list(set(evidence_files)),
                "signals": signals
            }

        # Priority 5: LOCAL_MONOLITH_WEB
        web_frameworks = {"spring-boot", "express", "nestjs", "next", "nuxt", "django", "flask", "fastapi", "rails", "laravel", "gin", "fiber"}
        if any(fw in signals["detected_frameworks"] for fw in web_frameworks) or signals["has_dockerfile_count"] == 1:
            signals["runtime_enclosure_hint"] = "local_runtime"
            return {
                "repo_type": "LOCAL_MONOLITH_WEB",
                "confidence": "HIGH",
                "evidence_files": list(set(evidence_files)),
                "signals": signals
            }

        # Priority 6: LOCAL_STANDALONE_APP
        signals["runtime_enclosure_hint"] = "local_runtime"
        return {
            "repo_type": "LOCAL_STANDALONE_APP",
            "confidence": "MEDIUM" if signals["primary_language"] != "unknown" else "LOW",
            "evidence_files": list(set(evidence_files)),
            "signals": signals
        }

    @staticmethod
    def _scan_file_tree(clone_dir: str) -> dict:
        files_set = set()
        file_ext_counts = {}
        top_dirs = []

        try:
            for root, dirs, files in os.walk(clone_dir):
                # Ignore noisy dirs
                dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', 'target', 'build', 'dist', 'venv', '.venv', '__pycache__'}]
                rel_root = os.path.relpath(root, clone_dir).replace("\\", "/")
                
                if rel_root == ".":
                    top_dirs = [d.lower() for d in dirs]

                for f in files:
                    rel_file = os.path.join(rel_root, f).replace("\\", "/") if rel_root != "." else f
                    files_set.add(rel_file)
                    
                    ext = f.split(".")[-1].lower() if "." in f else "no_ext"
                    file_ext_counts[ext] = file_ext_counts.get(ext, 0) + 1
        except Exception as e:
            print(f"Error scanning file tree: {e}")

        return {
            "files_set": files_set,
            "file_ext_counts": file_ext_counts,
            "top_dirs": top_dirs
        }

    @staticmethod
    def _detect_primary_language(file_ext_counts: dict) -> str:
        lang_map = {
            "java": "java", "py": "python", "js": "javascript", "ts": "typescript",
            "go": "go", "rs": "rust", "cpp": "c++", "c": "c", "cs": "c#", "php": "php", "rb": "ruby"
        }
        scores = {}
        for ext, count in file_ext_counts.items():
            if ext in lang_map:
                lang = lang_map[ext]
                scores[lang] = scores.get(lang, 0) + count
        if not scores:
            return "unknown"
        return max(scores, key=scores.get)

    @staticmethod
    def _detect_k8s_manifests(clone_dir: str, files_set: set) -> list:
        k8s_files = []
        candidate_files = [
            f for f in files_set 
            if f.endswith((".yaml", ".yml")) and any(p in f.lower() for p in ["k8s", "kubernetes", "manifest", "deploy", "chart", "helm"])
        ]
        
        for rel_path in candidate_files[:10]:
            full_path = os.path.join(clone_dir, rel_path)
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read(1500)
                    if "kind: Deployment" in content or "kind: Service" in content or "kind: Ingress" in content or "kind: StatefulSet" in content:
                        k8s_files.append(rel_path)
            except Exception:
                pass
        return k8s_files

    @staticmethod
    def _scan_descriptors_content(clone_dir: str, files_set: set) -> dict:
        result = {"frameworks": [], "deps": []}
        
        # package.json
        if "package.json" in files_set:
            try:
                full_path = os.path.join(clone_dir, "package.json")
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read().lower()
                    if "react" in content: result["frameworks"].append("react")
                    if "vue" in content: result["frameworks"].append("vue")
                    if "express" in content: result["frameworks"].append("express")
                    if "nestjs" in content or "@nest" in content: result["frameworks"].append("nestjs")
                    if "next" in content: result["frameworks"].append("next")
            except Exception:
                pass
                
        # pom.xml / build.gradle
        if "pom.xml" in files_set or "build.gradle" in files_set:
            try:
                file_name = "pom.xml" if "pom.xml" in files_set else "build.gradle"
                full_path = os.path.join(clone_dir, file_name)
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read().lower()
                    if "spring-boot" in content or "springframework" in content:
                        result["frameworks"].append("spring-boot")
            except Exception:
                pass

        # requirements.txt
        if "requirements.txt" in files_set:
            try:
                full_path = os.path.join(clone_dir, "requirements.txt")
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = [line.strip().lower().split("==")[0].split(">=")[0].split("[")[0]
                             for line in f if line.strip() and not line.startswith("#")]
                    result["deps"].extend(lines)
                    if "django" in lines: result["frameworks"].append("django")
                    if "flask" in lines: result["frameworks"].append("flask")
                    if "fastapi" in lines: result["frameworks"].append("fastapi")
            except Exception:
                pass

        # pyproject.toml (used by LangChain, modern Python projects)
        pyproject_paths = ["pyproject.toml"]
        for pp in pyproject_paths:
            if pp in files_set:
                try:
                    full_path = os.path.join(clone_dir, pp)
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read().lower()
                        # Extract deps from [project.dependencies] or [tool.poetry.dependencies]
                        dep_pattern = re.compile(r'["\']([a-z][a-z0-9_\-]+)["\']\s*[=:]|^([a-z][a-z0-9_\-]+)\s*[=><!]', re.MULTILINE)
                        raw_deps = dep_pattern.findall(content)
                        for d1, d2 in raw_deps:
                            dep = (d1 or d2).strip()
                            if dep and len(dep) > 2:
                                result["deps"].append(dep)
                        # Framework hints
                        if "fastapi" in content: result["frameworks"].append("fastapi")
                        if "django" in content: result["frameworks"].append("django")
                        if "flask" in content: result["frameworks"].append("flask")
                except Exception:
                    pass

        # setup.py / setup.cfg (older Python projects)
        for setup_file in ["setup.py", "setup.cfg"]:
            if setup_file in files_set:
                try:
                    full_path = os.path.join(clone_dir, setup_file)
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read().lower()
                        dep_pattern = re.compile(r'["\']([a-z][a-z0-9_\-]+)["\']')
                        for m in dep_pattern.finditer(content):
                            dep = m.group(1).strip()
                            if dep and len(dep) > 2:
                                result["deps"].append(dep)
                except Exception:
                    pass

        return result
