# MNMSOLAR Bridge Agent

Standalone Express server to act as a hybrid proxy, bridging files from UploadThing directly onto the local Windows file system to save cloud costs.

## Setup

1. Run `npm install` inside this folder.
2. Configure your Environment Variables in `.env`:
   - For Windows Local Dev: `ARCHIVE_BASE_PATH=D:\`
   - For Windows Server: `ARCHIVE_BASE_PATH=D:\MNMSOLAR\Archives`
3. Run `npm start`
4. The service will listen on `localhost:3001` and accept bridging signals from the cloud OS.
