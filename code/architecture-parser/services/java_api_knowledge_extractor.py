"""
JavaApiKnowledgeExtractor
=========================
Static analysis of Java Spring Boot controllers and DTOs using regex.
No execution, no Swagger, no OpenAPI required.

Extracts:
  - Controller-level @RequestMapping base paths
  - Method-level @GetMapping / @PostMapping / @PutMapping / @DeleteMapping / @PatchMapping
  - @RequestBody / @PathVariable / @RequestParam / @RequestHeader parameters
  - DTO fields with validation annotations (@NotNull, @NotBlank, @NotEmpty, @Email,
    @Pattern, @Min, @Max, @Size, @JsonProperty)
  - Security annotations (@PreAuthorize, @Secured, @RolesAllowed)
  - @ResponseStatus expected HTTP codes
"""

import os
import re
from typing import Optional

# ---------------------------------------------------------------------------
# Compiled regex patterns
# ---------------------------------------------------------------------------
CONTROLLER_PATTERN = re.compile(r'@(?:Rest)?Controller\b', re.IGNORECASE)
WEBSERVLET_PATTERN = re.compile(r'@WebServlet\s*\((.*?)\)', re.IGNORECASE | re.DOTALL)
HTTP_SERVLET_PATTERN = re.compile(r'extends\s+HttpServlet\b', re.IGNORECASE)

CLASS_MAPPING_PATTERN = re.compile(
    # Path may or may not start with '/'
    r'@RequestMapping\s*\(\s*(?:[^)]*?(?:value\s*=\s*)?)["\'](/?[^"\']*)["\']',
    re.IGNORECASE | re.DOTALL
)

METHOD_MAPPING_PATTERN = re.compile(
    r'@(Get|Post|Put|Delete|Patch)Mapping\s*'
    r'(?:\(\s*(?:[^)]*?(?:value\s*=\s*)?)["\'](/[^"\']*)?["\'][^)]*\)|(?:\(\s*\))?)',
    re.IGNORECASE | re.DOTALL
)

REQUEST_MAPPING_METHOD_PATTERN = re.compile(
    r'@RequestMapping\s*\([^)]*?method\s*=\s*RequestMethod\.(\w+)[^)]*?'
    r'(?:[^)]*?(?:value\s*=\s*)?["\'](/[^"\']*)["\'])?[^)]*?\)',
    re.IGNORECASE | re.DOTALL
)

REQUEST_BODY_PATTERN = re.compile(
    r'@RequestBody\s+(?:@Valid\s+)?(?:@\w+\s+)*(\w+(?:<[^>]+>)?)\s+\w+',
    re.IGNORECASE
)

PATH_VAR_PATTERN = re.compile(
    r'@PathVariable(?:\s*\(\s*(?:value\s*=\s*)?["\']([^"\']+)["\']\s*\))?\s+'
    r'(?:\w+\s+)?(\w+)\s+(\w+)',
    re.IGNORECASE
)

REQ_PARAM_PATTERN = re.compile(
    r'@RequestParam(?:\s*\(\s*([^)]*)\s*\))?\s+(?:\w+\s+)?(\w+)\s+(\w+)',
    re.IGNORECASE
)

REQ_PARAM_VALUE_PATTERN = re.compile(r'(?:value\s*=\s*)?["\']([^"\']+)["\']')
REQ_PARAM_REQUIRED_PATTERN = re.compile(r'required\s*=\s*(true|false)', re.IGNORECASE)
REQ_PARAM_DEFAULT_PATTERN = re.compile(r'defaultValue\s*=\s*["\']([^"\']*)["\']')

REQ_HEADER_PATTERN = re.compile(
    r'@RequestHeader\s*\(\s*(?:value\s*=\s*)?["\']([^"\']+)["\']\s*\)\s+'
    r'(?:\w+\s+)?(\w+)\s+(\w+)',
    re.IGNORECASE
)

RESPONSE_STATUS_PATTERN = re.compile(
    r'@ResponseStatus\s*\(\s*(?:value\s*=\s*|code\s*=\s*)?HttpStatus\.(\w+)',
    re.IGNORECASE
)

PREAUTH_PATTERN = re.compile(
    r"@(?:PreAuthorize|PreAuthorizeProjectMember|PreAuthorizeProjectLeader)\s*(?:\(\s*['\"]([^'\"]+)['\"]\s*\))?",
    re.IGNORECASE
)

SECURED_PATTERN = re.compile(
    r'@(?:Secured|RolesAllowed)\s*\(\s*\{([^}]+)\}\s*\)',
    re.IGNORECASE
)

# DTO field-level patterns (applied per field block)
NOT_NULL_PATTERN  = re.compile(r'@(?:NotNull|NotBlank|NotEmpty)\b', re.IGNORECASE)
EMAIL_PATTERN     = re.compile(r'@Email\b', re.IGNORECASE)
PATTERN_ANNOT     = re.compile(r'@Pattern\s*\(\s*regexp\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)
MIN_PATTERN       = re.compile(r'@Min\s*\(\s*(?:value\s*=\s*)?(\d+)\s*\)', re.IGNORECASE)
MAX_PATTERN       = re.compile(r'@Max\s*\(\s*(?:value\s*=\s*)?(\d+)\s*\)', re.IGNORECASE)
SIZE_PATTERN      = re.compile(
    r'@Size\s*\(\s*(?:min\s*=\s*(\d+)\s*,?\s*)?(?:max\s*=\s*(\d+)\s*,?\s*)?'
    r'(?:min\s*=\s*(\d+)\s*)?\s*\)',
    re.IGNORECASE
)
JSON_PROP_PATTERN = re.compile(r'@JsonProperty\s*\(\s*["\']([^"\']+)["\']', re.IGNORECASE)

# Field declaration: "private Type fieldName;" or "public Type fieldName;"
FIELD_DECL_PATTERN = re.compile(
    r'(?:private|protected|public)\s+(?:final\s+)?'
    r'([\w<>\[\],\s]+?)\s+(\w+)\s*;',
    re.DOTALL
)

# Class name in a file
CLASS_NAME_PATTERN = re.compile(
    r'(?:public\s+)?class\s+(\w+)',
    re.IGNORECASE
)

# HttpStatus code map
HTTP_STATUS_CODES = {
    'OK': 200, 'CREATED': 201, 'ACCEPTED': 202, 'NO_CONTENT': 204,
    'BAD_REQUEST': 400, 'UNAUTHORIZED': 401, 'FORBIDDEN': 403,
    'NOT_FOUND': 404, 'METHOD_NOT_ALLOWED': 405, 'CONFLICT': 409,
    'UNPROCESSABLE_ENTITY': 422, 'INTERNAL_SERVER_ERROR': 500,
}
SERVLET_STATUS_CODES = {
    'SC_OK': 200, 'SC_CREATED': 201, 'SC_ACCEPTED': 202, 'SC_NO_CONTENT': 204,
    'SC_BAD_REQUEST': 400, 'SC_UNAUTHORIZED': 401, 'SC_FORBIDDEN': 403,
    'SC_NOT_FOUND': 404, 'SC_METHOD_NOT_ALLOWED': 405, 'SC_CONFLICT': 409,
    'SC_UNPROCESSABLE_ENTITY': 422, 'SC_INTERNAL_SERVER_ERROR': 500,
}

# ---------------------------------------------------------------------------
# Main extractor class
# ---------------------------------------------------------------------------

class JavaApiKnowledgeExtractor:
    """
    Extracts API endpoint knowledge from Java Spring Boot source code
    using regex-based annotation parsing (no execution required).
    """

    EXCLUDED_DIRS  = {'test', 'tests', '.git', 'target', 'build', '__pycache__'}
    MAX_CONTROLLER_METHODS = 200
    MAX_DTO_CLASSES        = 80

    MAPPING_ANNOTATIONS = {
        'GetMapping':    'GET',
        'PostMapping':   'POST',
        'PutMapping':    'PUT',
        'DeleteMapping': 'DELETE',
        'PatchMapping':  'PATCH',
    }

    # -----------------------------------------------------------------------
    # Public entry point
    # -----------------------------------------------------------------------
    @classmethod
    def list_controller_files(cls, clone_dir: str) -> list:
        """
        Returns a list of relative file paths that contain Spring Boot controllers
        or Java Servlets — without extracting endpoint details.
        Used as Layer 1 input for AI-assisted file selection.
        """
        result = []
        for root, dirs, files in os.walk(clone_dir):
            dirs[:] = [d for d in dirs if d not in {'node_modules', '.git', 'target', 'build', '__pycache__'}]
            for filename in files:
                if not filename.endswith('.java'):
                    continue
                full_path = os.path.join(root, filename)
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                except Exception:
                    continue
                if (CONTROLLER_PATTERN.search(content)
                        or WEBSERVLET_PATTERN.search(content)
                        or HTTP_SERVLET_PATTERN.search(content)):
                    rel_path = os.path.relpath(full_path, clone_dir).replace('\\', '/')
                    result.append(rel_path)
        return result

    # -----------------------------------------------------------------------
    @classmethod
    def extract(cls, clone_dir: str) -> list:
        """
        Returns a list of endpoint dicts (ApiEndpointInfo).
        Each dict is fully serialisable to JSON.
        """
        # Phase 1: Build DTO registry  { SimpleClassName: DtoInfo }
        dto_registry = cls._build_dto_registry(clone_dir)

        # Phase 2: Walk controller files and extract endpoints
        endpoints = []
        for java_file, content in cls._iter_java_files(clone_dir):
            is_spring_controller = bool(CONTROLLER_PATTERN.search(content))
            is_servlet = bool(WEBSERVLET_PATTERN.search(content) and HTTP_SERVLET_PATTERN.search(content))
            if not is_spring_controller and not is_servlet:
                continue
            if is_spring_controller:
                base_path  = cls._extract_base_path(content)
                file_eps   = cls._parse_methods(content, base_path, java_file, dto_registry)
                endpoints.extend(file_eps)
            if is_servlet:
                endpoints.extend(cls._parse_servlet_methods(content, java_file))
            if len(endpoints) >= cls.MAX_CONTROLLER_METHODS:
                break

        return endpoints

    # -----------------------------------------------------------------------
    # File walking helpers
    # -----------------------------------------------------------------------
    @classmethod
    def _iter_java_files(cls, clone_dir: str):
        """Yields (relative_path, content) for every .java file, skipping excluded dirs."""
        for root, dirs, files in os.walk(clone_dir):
            # Prune excluded directories in-place
            dirs[:] = [
                d for d in dirs
                if d.lower() not in cls.EXCLUDED_DIRS
            ]
            for filename in files:
                if not filename.endswith('.java'):
                    continue
                full_path = os.path.join(root, filename)
                rel_path  = os.path.relpath(full_path, clone_dir).replace('\\', '/')
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    yield rel_path, content
                except Exception:
                    continue

    # -----------------------------------------------------------------------
    # DTO registry builder
    # -----------------------------------------------------------------------
    @classmethod
    def _build_dto_registry(cls, clone_dir: str) -> dict:
        """
        Scan all Java files and build { SimpleClassName: DtoInfo } for files
        whose name contains Request/Response/Dto/DTO/Body/Payload.
        """
        registry = {}
        count    = 0
        for java_file, content in cls._iter_java_files(clone_dir):
            if count >= cls.MAX_DTO_CLASSES:
                break
            filename = os.path.basename(java_file)
            if not any(kw in filename for kw in
                       ['Request', 'Response', 'Dto', 'DTO', 'Body', 'Payload', 'Create', 'Update']):
                continue
            dto = cls._parse_dto_class(content, filename)
            if dto:
                registry[dto['className']] = dto
                count += 1
        return registry

    @classmethod
    def _parse_dto_class(cls, content: str, filename: str) -> Optional[dict]:
        """Extract the class name and its fields from a DTO Java file."""
        class_match = CLASS_NAME_PATTERN.search(content)
        if not class_match:
            return None

        class_name = class_match.group(1)

        # Find the class body (everything between first { and matching })
        body_start = content.find('{', class_match.start())
        if body_start == -1:
            return None
        class_body = cls._extract_class_body(content, body_start)
        fields = cls._extract_dto_fields(class_body)

        return {'className': class_name, 'fields': fields}

    @classmethod
    def _extract_class_body(cls, content: str, open_brace_idx: int) -> str:
        """Extract the text of a class body from the opening { to the matching }."""
        depth = 0
        end = open_brace_idx
        for i in range(open_brace_idx, len(content)):
            if content[i] == '{':
                depth += 1
            elif content[i] == '}':
                depth -= 1
                if depth == 0:
                    return content[open_brace_idx + 1:i]
        # Fallback: never found a matching } — return at most 50 000 chars to avoid runaway
        return content[open_brace_idx + 1: open_brace_idx + 50_000]

    @classmethod
    def _extract_dto_fields(cls, class_body: str) -> list:
        """Parse field declarations from a DTO class body, extracting validation annotations."""
        fields = []
        lines = class_body.split('\n')
        annotation_block = []

        for line in lines:
            stripped = line.strip()

            if stripped.startswith('@'):
                # Accumulate annotation lines
                annotation_block.append(stripped)

            elif re.match(r'(?:private|protected|public)\s+', stripped):
                # Field or method declaration — try to parse as a field
                field = cls._parse_field_with_annotations(stripped, '\n'.join(annotation_block))
                if field:
                    fields.append(field)
                # Always reset after a field/method declaration
                annotation_block = []

            elif stripped == '':
                # Blank line: reset only if we haven't started an annotation block yet
                # (blank lines between annotations and the field they annotate are allowed)
                pass  # do NOT reset — annotations may be separated from field by blank line

            else:
                # Any other non-annotation line (comment, method body, etc.) resets the block
                if not stripped.startswith('//') and not stripped.startswith('*'):
                    annotation_block = []

        return fields

    @classmethod
    def _parse_field_with_annotations(cls, field_line: str, annotation_block: str) -> Optional[dict]:
        """Parse a single field declaration and its preceding annotation block."""
        m = FIELD_DECL_PATTERN.match(field_line)
        if not m:
            return None

        java_type  = m.group(1).strip()
        field_name = m.group(2).strip()

        # Skip static / final constants (usually uppercase)
        if field_name.isupper():
            return None

        combined = annotation_block + '\n' + field_line

        # Determine JSON name (@JsonProperty overrides camelCase)
        json_name = field_name
        jp = JSON_PROP_PATTERN.search(annotation_block)
        if jp:
            json_name = jp.group(1)

        # Required?
        required = bool(NOT_NULL_PATTERN.search(annotation_block))

        # Validations
        validations = []
        if EMAIL_PATTERN.search(annotation_block):
            validations.append({'type': 'EMAIL'})
        pa = PATTERN_ANNOT.search(annotation_block)
        if pa:
            validations.append({'type': 'PATTERN', 'regexp': pa.group(1)})
        min_m = MIN_PATTERN.search(annotation_block)
        if min_m:
            validations.append({'type': 'MIN', 'value': int(min_m.group(1))})
        max_m = MAX_PATTERN.search(annotation_block)
        if max_m:
            validations.append({'type': 'MAX', 'value': int(max_m.group(1))})
        size_m = SIZE_PATTERN.search(annotation_block)
        if size_m:
            size_entry = {'type': 'SIZE'}
            # groups: (min1, max1, min2) — handle both orderings
            g1, g2, g3 = size_m.group(1), size_m.group(2), size_m.group(3)
            if g1:
                size_entry['min'] = int(g1)
            if g2:
                size_entry['max'] = int(g2)
            if g3 and 'min' not in size_entry:
                size_entry['min'] = int(g3)
            validations.append(size_entry)

        return {
            'jsonName':    json_name,
            'javaType':    java_type,
            'required':    required,
            'validations': validations,
        }

    # -----------------------------------------------------------------------
    # Controller parsing
    # -----------------------------------------------------------------------
    @classmethod
    def _extract_base_path(cls, content: str) -> str:
        """Extract class-level @RequestMapping path."""
        m = CLASS_MAPPING_PATTERN.search(content)
        if m:
            return m.group(1).rstrip('/')
        return ''

    @classmethod
    def _parse_methods(cls, content: str, base_path: str, source_file: str, dto_registry: dict) -> list:
        """
        Scan a controller file for all HTTP-mapped methods and extract endpoint info.
        Uses a line-by-line approach to collect annotation blocks per method.
        A brace-depth counter is used to detect method boundaries and prevent
        annotation leakage across methods.
        """
        endpoints = []
        lines = content.split('\n')
        annotation_block = []
        brace_depth = 0          # track { } nesting to detect end of method body
        in_method_body = False   # True after we enter the { of a method

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Track brace depth for method-boundary detection
            brace_depth += stripped.count('{') - stripped.count('}')

            # Detect leaving a method body (depth drops back to class level ~1)
            if in_method_body and brace_depth <= 1:
                in_method_body = False
                annotation_block = []  # reset: fresh start for next method

            if stripped.startswith('@'):
                if not in_method_body:
                    annotation_block.append(stripped)

            elif re.search(r'(?:public|protected)\s+\S+\s+\w+\s*\(', stripped):
                if not in_method_body:
                    ep = cls._try_parse_endpoint(
                        annotation_block, stripped, base_path, source_file, dto_registry, lines, i
                    )
                    if ep:
                        endpoints.append(ep)
                    annotation_block = []
                    in_method_body = True  # next { will be the method body open

            elif not in_method_body:
                # Reset annotation block on any non-annotation, non-method line
                if stripped and not stripped.startswith('//') and not stripped.startswith('*'):
                    annotation_block = []

        return endpoints

    @classmethod
    def _try_parse_endpoint(cls, annotation_block: list, method_signature: str,
                             base_path: str, source_file: str, dto_registry: dict,
                             all_lines: list, method_line_idx: int) -> Optional[dict]:
        """Try to extract an endpoint from an annotation block + method signature."""
        block_text = '\n'.join(annotation_block)

        # Determine HTTP method and relative path
        http_method = None
        rel_path    = ''

        # Check @GetMapping / @PostMapping etc.
        for anno, verb in cls.MAPPING_ANNOTATIONS.items():
            if f'@{anno}' in block_text:
                http_method = verb
                # Extract path from the annotation
                anno_match = re.search(
                    rf'@{anno}\s*(?:\(\s*(?:[^)]*?(?:value\s*=\s*)?)?["\']([^"\']*)["\'][^)]*\)|\(\s*\))?',
                    block_text, re.IGNORECASE | re.DOTALL
                )
                if anno_match and anno_match.group(1):
                    rel_path = anno_match.group(1)
                break

        # Check @RequestMapping with method attribute
        if not http_method:
            rm = REQUEST_MAPPING_METHOD_PATTERN.search(block_text)
            if rm:
                http_method = rm.group(1).upper()
                if rm.group(2):
                    rel_path = rm.group(2)

        if not http_method:
            return None

        # Build full path
        full_path = base_path.rstrip('/') + '/' + rel_path.lstrip('/')
        full_path = full_path.rstrip('/')
        if not full_path:
            full_path = '/'

        # Extract method name from signature
        method_name_match = re.search(r'(\w+)\s*\(', method_signature)
        method_name = method_name_match.group(1) if method_name_match else 'unknown'

        # Collect the method parameter string (may span multiple lines)
        param_text = cls._collect_params(all_lines, method_line_idx)

        # Extract @ResponseStatus
        rs = RESPONSE_STATUS_PATTERN.search(block_text)
        if rs:
            status_name = rs.group(1).upper()
            expected_statuses = [HTTP_STATUS_CODES.get(status_name, 200)]
        else:
            expected_statuses = [200]

        # Extract security
        auth_info = cls._extract_auth(block_text)

        # Extract parameters
        path_variables = cls._extract_path_variables(param_text)
        query_params   = cls._extract_query_params(param_text)
        request_headers= cls._extract_request_headers(param_text)
        request_body   = cls._extract_request_body(param_text, dto_registry)

        # Humanize description
        description = cls._humanize(method_name)

        return {
            'httpMethod':       http_method,
            'path':             full_path,
            'controllerClass':  source_file.split('/')[-1].replace('.java', ''),
            'methodName':       method_name,
            'description':      description,
            'requestBody':      request_body,
            'pathVariables':    path_variables,
            'queryParams':      query_params,
            'requestHeaders':   request_headers,
            'authentication':   auth_info,
            'expectedStatuses': expected_statuses,
            'sourceFile':       source_file,
        }

    @classmethod
    def _collect_params(cls, lines: list, method_line_idx: int) -> str:
        """Collect parameter text from method signature (handles multi-line signatures)."""
        collected = []
        depth = 0
        started = False
        for i in range(method_line_idx, min(method_line_idx + 20, len(lines))):
            line = lines[i]
            collected.append(line)   # always append first, then scan for balance
            for ch in line:
                if ch == '(':
                    depth += 1
                    started = True
                elif ch == ')':
                    depth -= 1
                    if depth == 0 and started:
                        return ' '.join(collected)
        return ' '.join(collected)

    @classmethod
    def _parse_servlet_methods(cls, content: str, source_file: str) -> list:
        paths = cls._extract_webservlet_paths(content)
        if not paths:
            return []

        controller_class = source_file.split('/')[-1].replace('.java', '')
        api_paths = [
            path for path in paths
            if path.startswith('/api/') or '/api/' in path or 'api' in controller_class.lower()
        ]
        if not api_paths:
            return []

        endpoints = []
        for method_name, http_method in (
            ('doGet', 'GET'),
            ('doPost', 'POST'),
            ('doPut', 'PUT'),
            ('doDelete', 'DELETE'),
            ('doPatch', 'PATCH'),
        ):
            method_body = cls._extract_named_method_body(content, method_name)
            if method_body is None:
                continue

            params = cls._extract_servlet_parameters(method_body)
            query_params = params if http_method in ('GET', 'DELETE') else []
            request_body = None
            if http_method not in ('GET', 'DELETE') and params:
                request_body = {
                    'className': 'ServletRequestParameters',
                    'fields': [
                        {
                            'jsonName': p['name'],
                            'javaType': p['javaType'],
                            'required': p['required'],
                            'validations': [],
                        }
                        for p in params
                    ],
                }

            for path in api_paths:
                endpoints.append({
                    'httpMethod':       http_method,
                    'path':             path,
                    'controllerClass':  controller_class,
                    'methodName':       method_name,
                    'description':      cls._humanize(controller_class.replace('Servlet', '') + ' ' + method_name),
                    'requestBody':      request_body,
                    'pathVariables':    [],
                    'queryParams':      query_params,
                    'requestHeaders':   [],
                    'authentication':   cls._extract_servlet_auth(method_body),
                    'expectedStatuses': cls._extract_servlet_statuses(method_body),
                    'sourceFile':       source_file,
                    'framework':        'Servlet',
                })

        return endpoints

    @classmethod
    def _extract_webservlet_paths(cls, content: str) -> list:
        paths = []
        for servlet_match in WEBSERVLET_PATTERN.finditer(content):
            args = servlet_match.group(1)
            for path in re.findall(r'["\'](/[^"\']*)["\']', args):
                if path and path not in paths:
                    paths.append(path)
        return paths

    @classmethod
    def _extract_named_method_body(cls, content: str, method_name: str) -> Optional[str]:
        signature = re.search(
            rf'(?:public|protected)\s+void\s+{re.escape(method_name)}\s*\(',
            content,
            re.IGNORECASE,
        )
        if not signature:
            return None
        open_brace = content.find('{', signature.end())
        if open_brace == -1:
            return ''
        return cls._extract_class_body(content, open_brace)

    @classmethod
    def _extract_servlet_parameters(cls, method_body: str) -> list:
        params = []
        seen = set()
        for name in re.findall(r'\.getParameter\s*\(\s*["\']([^"\']+)["\']\s*\)', method_body):
            if name in seen:
                continue
            seen.add(name)
            params.append({
                'name': name,
                'javaType': 'String',
                'required': False,
                'defaultValue': None,
            })
        return params

    @classmethod
    def _extract_servlet_statuses(cls, method_body: str) -> list:
        statuses = {200}
        for status_name in re.findall(r'HttpServletResponse\.(SC_[A-Z_]+)', method_body):
            code = SERVLET_STATUS_CODES.get(status_name)
            if code:
                statuses.add(code)
        for code in re.findall(r'\.(?:setStatus|sendError)\s*\(\s*([1-5]\d{2})', method_body):
            statuses.add(int(code))
        return sorted(statuses)

    @classmethod
    def _extract_servlet_auth(cls, method_body: str) -> dict:
        required = bool(re.search(r'getSession\s*\(\s*false\s*\)|getAttribute\s*\(\s*["\'](?:user|account|role|admin|student|teacher)', method_body, re.IGNORECASE))
        return {
            'required': required,
            'public': not required,
            'roles': [],
        }

    # -----------------------------------------------------------------------
    # Parameter extractors
    # -----------------------------------------------------------------------
    @classmethod
    def _extract_path_variables(cls, param_text: str) -> list:
        results = []
        for m in PATH_VAR_PATTERN.finditer(param_text):
            name_override = m.group(1)  # from @PathVariable("name")
            java_type     = m.group(2)
            param_name    = m.group(3)
            results.append({
                'name':     name_override if name_override else param_name,
                'javaType': java_type,
                'required': True,
                'defaultValue': None,
            })
        return results

    @classmethod
    def _extract_query_params(cls, param_text: str) -> list:
        results = []
        for m in REQ_PARAM_PATTERN.finditer(param_text):
            anno_args  = m.group(1) or ''
            java_type  = m.group(2)
            param_name = m.group(3)

            name_m    = REQ_PARAM_VALUE_PATTERN.search(anno_args)
            name      = name_m.group(1) if name_m else param_name

            req_m     = REQ_PARAM_REQUIRED_PATTERN.search(anno_args)
            required  = (req_m.group(1).lower() != 'false') if req_m else True

            def_m     = REQ_PARAM_DEFAULT_PATTERN.search(anno_args)
            default   = def_m.group(1) if def_m else None

            results.append({
                'name':         name,
                'javaType':     java_type,
                'required':     required,
                'defaultValue': default,
            })
        return results

    @classmethod
    def _extract_request_headers(cls, param_text: str) -> list:
        results = []
        for m in REQ_HEADER_PATTERN.finditer(param_text):
            results.append({
                'name':     m.group(1),
                'javaType': m.group(2),
                'required': True,
                'defaultValue': None,
            })
        return results

    @classmethod
    def _extract_request_body(cls, param_text: str, dto_registry: dict) -> Optional[dict]:
        m = REQUEST_BODY_PATTERN.search(param_text)
        if not m:
            return None
        type_name = m.group(1).strip()
        # Strip generics (e.g. List<TaskRequest> → TaskRequest)
        simple = re.sub(r'<.*>', '', type_name).strip()
        dto = dto_registry.get(simple)
        if dto:
            return dto
        # Not found in registry — return minimal info
        return {'className': simple, 'fields': []}

    # -----------------------------------------------------------------------
    # Security extraction
    # -----------------------------------------------------------------------
    @classmethod
    def _extract_auth(cls, block_text: str) -> dict:
        roles = []

        pa = PREAUTH_PATTERN.search(block_text)
        if pa:
            # group(1) is the expression inside @PreAuthorize("..."); may be None for
            # custom annotations like @PreAuthorizeProjectMember that have no args
            expr = pa.group(1) if pa.group(1) else ''
            if expr:
                # Extract role names from hasRole('ROLE_X') or hasAnyRole('ROLE_X','ROLE_Y')
                role_matches = re.findall(
                    r"hasAnyRole\s*\(([^)]+)\)|hasRole\s*\('([^']+)'\)", expr
                )
                for grp in role_matches:
                    for r in grp:
                        if r:
                            for part in r.split(','):
                                clean = part.strip().strip("'\"")
                                if clean:
                                    roles.append(clean)
                if not roles:
                    # Store the raw expression as a hint (truncated)
                    roles = [expr[:80]]

        sec = SECURED_PATTERN.search(block_text)
        if sec:
            for r in sec.group(1).split(','):
                clean = r.strip().strip('"\'')
                if clean:
                    roles.append(clean)

        required = bool(pa or sec)
        public   = not required

        return {
            'required': required,
            'public':   public,
            'roles':    list(dict.fromkeys(roles)),  # deduplicate, preserve order
        }

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------
    @classmethod
    def _humanize(cls, method_name: str) -> str:
        """Convert camelCase method name to human-readable description."""
        # Insert space before uppercase letters
        spaced = re.sub(r'([A-Z])', r' \1', method_name).strip()
        return spaced.capitalize()
