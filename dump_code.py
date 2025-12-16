import os

def dump_codebase(root_dirs, output_file):
    extensions = {'.java', '.ts', '.html', '.css', '.xml', '.yml', '.json', '.js'}
    exclude_dirs = {'node_modules', 'target', '.git', '.idea', '.vscode', 'dist', 'coverage'}
    # Files to explicitly exclude if needed (e.g. large locks)
    exclude_files = {'package-lock.json', 'yarn.lock'}

    with open(output_file, 'w', encoding='utf-8') as out:
        out.write("# Codebase Dump\n\n")
        
        for root_dir in root_dirs:
            for dirpath, dirnames, filenames in os.walk(root_dir):
                # Modify dirnames in-place to skip excluded directories
                dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
                
                for filename in filenames:
                    if filename in exclude_files:
                        continue
                        
                    ext = os.path.splitext(filename)[1]
                    if ext in extensions or filename in {'Dockerfile', 'docker-compose.yml', 'Jenkinsfile'}:
                        filepath = os.path.join(dirpath, filename)
                        relpath = os.path.relpath(filepath, os.path.dirname(root_dirs[0])) # Relative to parent of backend/frontend if possible
                        
                        try:
                            with open(filepath, 'r', encoding='utf-8') as f:
                                # Skip very large files
                                f.seek(0, 2)
                                size = f.tell()
                                f.seek(0)
                                if size > 100 * 1024: # Skip > 100KB
                                    out.write(f"## File: {relpath} (SKIPPED - TOO LARGE > 100KB)\n\n")
                                    continue
                                    
                                content = f.read()
                                
                                out.write(f"## File: {relpath}\n")
                                language = ext[1:] if ext else 'text'
                                if language == 'ts' or language == 'js': language = 'typescript'
                                if language == 'yml': language = 'yaml'
                                
                                out.write(f"```{language}\n")
                                out.write(content)
                                out.write("\n```\n\n")
                        except Exception as e:
                            out.write(f"## File: {relpath} (ERROR READ: {e})\n\n")

if __name__ == "__main__":
    roots = [
        "/Users/almostaphasmart/ecommerce-platform/backend",
        "/Users/almostaphasmart/ecommerce-platform/frontend"
    ]
    output = "/Users/almostaphasmart/.gemini/antigravity/brain/1c190924-a077-471d-b998-10184827c660/codebase_source.md"
    dump_codebase(roots, output)
    print(f"Dump complete to {output}")
