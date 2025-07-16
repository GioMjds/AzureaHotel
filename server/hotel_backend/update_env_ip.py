import socket
import re
import os

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def update_env_file(env_path, replacements):
    with open(env_path, 'r') as file:
        lines = file.readlines()
    with open(env_path, 'w') as file:
        for line in lines:
            written = False
            for key, value in replacements.items():
                if re.match(rf'^{re.escape(key)}=', line):
                    file.write(f'{key}={value}\n')
                    written = True
                    break
            if not written:
                file.write(line)

def main():
    ip = get_local_ip()
    # Update server/.env
    server_env = os.path.join(os.path.dirname(__file__), '..', '.env')
    server_replacements = {
        'CLIENT_URL': f'http://{ip}:5173',
        'REDIRECT_URI': f'http://{ip}:5173',
        'DB_HOST': ip,
    }
    update_env_file(server_env, server_replacements)
    print(f"Updated {server_env} with IP {ip}")

    # Update client/.env
    client_env = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'client', '.env'))
    client_replacements = {
        'VITE_API_URL': f'"http://{ip}:8000"',
        'VITE_REDIRECT_URI': f'"http://{ip}:5173"',
        'VITE_CURRENT_IP_ADDRESS': f"{ip}",
    }
    update_env_file(client_env, client_replacements)
    print(f"Updated {client_env} with IP {ip}")

if __name__ == "__main__":
    main()
