# DevVerse — Agent Operational Rules & Workflows

## 1. Version Control & Git Guidelines
- **GitHub Desktop Synchronized**: This repository is synchronized with Git using **GitHub Desktop**.
- **No Git CLI Commits**: Do not run `git commit`, `git push`, or expect `git` to be available in PATH. All staging and commits are managed by the user via GitHub Desktop.

## 2. DevVerse Portable Version & Archive
- **Portable Directory**: `C:\Users\Ombid\ops\Scratch\DevVerse-Portable`
- **Portable Archive (ZIP)**: `C:\Users\Ombid\ops\Scratch\DevVerse-Portable.zip`
- **Bloat-Free Policy**: The portable directory is completely clean of development artifacts. It **strictly excludes**:
  - `node_modules/`
  - `.git/`
  - `.next/`
  - `.vscode/`
  - `tests/` and `vitest.config.ts`
  - Build caches (`tsconfig.tsbuildinfo`, `.system_generated`)
  - Git configuration (`.gitignore`, `.gitattributes`)
- **Independent from Git**: Neither the portable directory nor `DevVerse-Portable.zip` is linked to Git in any way.

## 3. Mandatory Synchronization Rule
- **Every time any code changes, bug fixes, or updates are made to DevVerse**, they **MUST** immediately be synced to `DevVerse-Portable`, and the `DevVerse-Portable.zip` archive must be re-packaged.
- **Automated Sync Command**:
  ```bash
  node scripts/sync-portable.mjs
  # or
  npm run sync-portable
  ```
- Always ensure `scripts/sync-portable.mjs` runs to completion and logs success before finalizing any task.

## 4. Production Deployment & Live Environment
- **Platform**: Hosted on [Render](https://render.com/) Web Service.
- **Custom Domain**: `https://devverse.run.place`
- **Continuous Deployment**: When the user commits and pushes changes via **GitHub Desktop**, Render automatically detects the repository update, builds the project (`npm install && npm run build`), and redeploys to `https://devverse.run.place`.
- **Pre-Commit Quality Gate**: Because pushes immediately trigger production redeployment, all code changes must pass automated verification (`cmd /c "npm test"` and `cmd /c "npm run typecheck"`) and be synced to portable (`npm run sync-portable`) before signaling readiness to the user.
