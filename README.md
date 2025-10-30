# Kash_Files
Simple s3-based file sharing server designed to run behind cloudflare tunnels, provides storage for media content shared in Kash for multiple nodes if desired.
# Kash Files

A secure, self-hosted file storage system with built-in encryption and expiration. Files are stored locally using MinIO S3-compatible storage, with access controlled through atomic API keys and protected by master key authentication.

## Architecture

**Kash Files** is designed as part of the larger "Pulse" ecosystem:
- **Pulse**: Core framework with digests (text content) and tags for organization
- **Kash**: Web interface for Pulse with AI tools and organizational features  
- **Kash Files**: Secure file storage addon that integrates with Pulse/Kash

### How It Works

- **Local S3 Storage**: Uses MinIO container for S3-compatible object storage
- **Encrypted Access**: Files protected by master key or WebAuthn authentication
- **Automatic Expiration**: Files self-destruct after configurable time periods
- **Atomic API Keys**: Individual keys for specific actions (upload, manage, etc.)
- **Cloudflare Tunnel**: Secure public access without port forwarding
- **No Database**: Uses S3 metadata files - Pulse/Kash act as the index

### File Workflow

1. Upload files via web interface or API with expiration settings
2. Get unique download URLs with embedded access keys
3. Share links - files are accessible until expiration
4. Files automatically expire and become inaccessible
5. Emergency controls for bulk operations and system reset

## Prerequisites

- **Docker & Docker Compose**
- **Cloudflare Account** (free tier works)
- **Domain** managed through Cloudflare DNS

## Cloudflare Tunnel Setup

### 1. Purchase & Configure Domain

1. Buy a domain (or transfer existing one to Cloudflare)
2. In Cloudflare dashboard, add your domain
3. Update nameservers at your registrar to Cloudflare's nameservers

### 2. Create Cloudflare Tunnel

1. Go to **Cloudflare Zero Trust Dashboard**
2. Navigate to **Access** → **Tunnels**
3. Click **Create a tunnel**
4. Choose **Cloudflared** connector
5. Name your tunnel (e.g., "kash-files")
6. **Important**: Select the **Docker** installation method
7. Copy the tunnel token (starts with `eyJ...`)

### 3. Configure Public Hostname

1. In your tunnel settings, add a **Public Hostname**:
   - **Subdomain**: `files` (or whatever you prefer)
   - **Domain**: `yourdomain.com`
   - **Service Type**: `HTTP`
   - **URL**: `localhost:3000`

2. Your files will be accessible at `https://files.yourdomain.com`

## Kash Files Installation

### 1. Clone & Configure

```bash
git clone <repository-url>
cd kash-files
```

### 2. Set Up Environment

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  kashfiles:
    build: .
    container_name: kash-files
    environment:
      - CF_TUNNEL_TOKEN=your_tunnel_token_here
      - NUXT_S3_ENDPOINT=http://minio:9000
      - NUXT_S3_REGION=us-east-1
      - NUXT_S3_ACCESS_KEY_ID=minioadmin
      - NUXT_S3_SECRET_ACCESS_KEY=minioadmin
      - NUXT_S3_BUCKET=kashfiles
      - NODE_ENV=production
    depends_on:
      - minio
    networks:
      - kashnet

  minio:
    image: minio/minio:latest
    container_name: kash-minio
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    networks:
      - kashnet

networks:
  kashnet:
    driver: bridge

volumes:
  minio_data:
```

### 3. Replace Tunnel Token

In `docker-compose.yml`, replace `your_tunnel_token_here` with your actual Cloudflare tunnel token.

### 4. Deploy

```bash
sudo docker-compose up -d --build
```

### 5. Verify Deployment

- Check containers: `sudo docker-compose ps`
- View logs: `sudo docker-compose logs -f kashfiles`
- Access your site: `https://files.yourdomain.com`

## Initial Setup

### 1. Master Key Configuration

1. Visit `https://files.yourdomain.com/setup`
2. Choose **Master Key** authentication method
3. Create a strong master key (minimum 12 characters)
4. Save this key securely - it cannot be recovered if lost

### 2. Login & Navigation

1. Go to `https://files.yourdomain.com/login`
2. Enter your master key
3. You'll see the main navigation:
   - **Files**: Upload and manage your files
   - **Keys**: Create and manage API keys
   - **Setup**: Reconfigure system settings
   - **Emergency**: Bulk operations and system reset

## Using Kash Files

### File Upload

1. Go to **Files** page
2. Drag & drop files or click **Select Files**
3. Set expiration (default: 365 days)
4. Click **Upload**
5. Copy the generated download links

### API Key Management

1. Go to **Keys** page
2. Click **Create New API Key**
3. Optionally set expiration date and name
4. **Important**: Copy the key immediately - it won't be shown again
5. Use API keys for:
   - Automated uploads from desktop/mobile apps
   - Integration with other services
   - Temporary access for specific tasks

### File Management Features

- **Search**: Find files by name
- **Filter**: By status (Active, Expiring, Expired) and date
- **Bulk Operations**: 
  - Select multiple files
  - Bulk delete or update expiration
  - Copy multiple download links
- **File Details**: View upload date, expiry, file size, and source

### API Usage

Upload files programmatically:

```bash
curl -X POST https://files.yourdomain.com/api/files/upload \
  -H "x-upload-key: your_api_key_here" \
  -F "file=@/path/to/file.jpg" \
  -F "filename=file.jpg" \
  -F "decay=365"
```

## Emergency Functions

The **Emergency** page provides nuclear options for data management:

### ⚠️ Delete All Files
- Permanently removes all uploaded files
- Breaks all existing download links
- **Cannot be undone**
- Requires typing "DELETE ALL FILES" to confirm

### ⚠️ Revoke All API Keys
- Invalidates all existing API keys
- Stops all automated uploads
- You'll need to create new keys to continue

### 🚨 Nuclear Reset
- Deletes ALL data (files + keys + configuration)
- Completely resets the system to fresh state
- Requires typing "NUCLEAR RESET" to confirm
- **Only use when completely starting over**

## Security Features

- **Master Key Protection**: All data encrypted and protected
- **Automatic Expiration**: Files become inaccessible after set time
- **Atomic API Keys**: Individual keys can be revoked without affecting others
- **No External Dependencies**: All data stored locally
- **Secure Tunneling**: Cloudflare provides HTTPS and DDoS protection
- **No Port Exposure**: No need to open firewall ports

## Maintenance

### Backup Data
```bash
# Backup MinIO data
sudo docker run --rm -v kashfiles_minio_data:/data -v $(pwd):/backup ubuntu tar czf /backup/minio-backup.tar.gz -C /data .
```

### View Logs
```bash
sudo docker-compose logs -f kashfiles
sudo docker-compose logs -f minio
```

### Update System
```bash
sudo docker-compose down
git pull
sudo docker-compose up -d --build
```

### Reset Everything
```bash
sudo docker-compose down -v  # WARNING: Deletes all data
sudo docker-compose up -d --build
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
sudo docker-compose logs kashfiles

# Rebuild from scratch
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

### Can't Access Files
- Verify Cloudflare tunnel is running
- Check tunnel configuration in Cloudflare dashboard
- Ensure domain DNS is pointing to Cloudflare

### S3 Connection Issues
```bash
# Test MinIO connectivity from inside container
sudo docker exec -it kash-files curl -v http://minio:9000/minio/health/live
```

### Reset Master Key
1. Go to **Setup** page while logged in
2. Enter current master key
3. Set new master key
4. All API keys remain valid

## Integration with Pulse/Kash

When using with the broader Pulse ecosystem:

1. **Upload files** through Kash Files
2. **Copy download links** from the Files interface
3. **Create digests** in Pulse/Kash with the file links
4. **Tag and organize** through Kash's AI tools
5. **Share collections** of files + context through Pulse

This creates a powerful combination of secure file storage with intelligent organization and sharing capabilities.

---

## Support

For issues:
1. Check container logs: `sudo docker-compose logs -f`
2. Verify Cloudflare tunnel status in Zero Trust dashboard
3. Test S3 connectivity from inside container
4. Use Emergency functions to reset if needed

**Remember**: This system is designed for privacy and security. Master keys cannot be recovered if lost, and expired files cannot be restored. Always backup important data externally.
