import os
import http.server
import ssl
import socketserver
import argparse

parser = argparse.ArgumentParser(description="HTTPSServer \n Usage: python3 server.py 8987")
parser.add_argument("port", type=int, default=443, nargs="?", help="Port Number, default is 8987")
args = parser.parse_args()
CERT_PATH = "./cert/localhost.crt"
KEY_PATH = "./cert/localhost.key"
PEM_PATH = "./cert/localhost.pem"

def create_https_server(cert_path,key_path,port=8987):
    if (os.geteuid() != 0 and port <=1024):
        exit("You need to have root privileges to run this script.\nPlease try again, this time using 'sudo'. Exiting.")

    server_address = ('0.0.0.0', port)

    try:
        print('Creating context...')
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(cert_path, key_path)

        print('Creating server...')
        with socketserver.TCPServer(server_address, http.server.SimpleHTTPRequestHandler) as httpd:
            print('Creating socket...')
            with context.wrap_socket(httpd.socket, server_side=True) as ssock:
                httpd.socket = ssock

                print(f"Serving securely on https://localhost:{port}")
                httpd.serve_forever()
    except Exception as e:
        print(e)
        exit("[ERR] Port %d has been taken."%(port))

if __name__ == "__main__":
    try:
        create_https_server(CERT_PATH,KEY_PATH,args.port)
    except KeyboardInterrupt:
        print("\n- Shutting down...\n")
    except Exception as err:
        print("Error: ")
        print(err)
