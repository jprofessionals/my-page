{
  description = "Development environment for My-Page project";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
          };
        };

        # Backend dependencies
        jdk = pkgs.jdk21;
        maven = pkgs.maven;
        kotlin = pkgs.kotlin;

        # Frontend dependencies
        nodejs = pkgs.nodejs_20;
        pnpm = pkgs.nodePackages.pnpm;

        # Infrastructure dependencies
        terraform = pkgs.terraform;
        google-cloud-sdk = pkgs.google-cloud-sdk;

        # Common development tools
        common-dev-tools = with pkgs; [
          git
          curl
          wget
          jq
          yq
        ];

        isAarch64Darwin = (system == "aarch64-darwin");
        isLinux = pkgs.stdenv.isLinux;

      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            # Backend
            jdk
            maven
            kotlin

            # Frontend
            nodejs
            pnpm

            # Infrastructure
            terraform
            google-cloud-sdk

            # Common tools
            common-dev-tools
#            pre-commit
#            detect-secrets # important to prevent secrets from accidentally being committed
#            shellcheck
          ];

          shellHook = ''
            echo "Welcome to My-Page development environment!"
            echo ""
            echo "Project components:"
            echo "1. Backend (my-page-api): Spring Boot + Kotlin"
            echo "2. Frontend (my-page-app): Next.js + TypeScript"
            echo "3. Infrastructure: Terraform + GCP"
            echo ""
            echo "Available tools:"
            echo "- Java: $(java -version 2>&1 | head -n 1)"
            echo "- Maven: $(mvn --version | head -n 1)"
            echo "- Kotlin: $(kotlin -version 2>&1)"
            echo "- Node.js: $(node --version)"
            echo "- pnpm: $(pnpm --version)"
            echo "- Terraform: $(terraform version | head -n 1)"
            echo "- Google Cloud SDK: $(gcloud --version | head -n 1)"
            echo ""
            echo "Quick start:"
            echo "- Backend: cd my-page-api && mvn spring-boot:run"
            echo "- Frontend: cd my-page-app && pnpm install && pnpm run dev"
            echo "- Infrastructure: cd infrastructure && terraform init"
            echo ""

            # Environment validation
            check_docker() {
              echo "Validating Docker environment..."
              if ! command -v docker &>/dev/null; then
                echo "❌ ERROR: Docker not found. Install Docker Desktop or Colima"
                return 1
              fi

              if ! docker info &>/dev/null; then
                echo "ERROR: Docker daemon not running:"
                ${pkgs.lib.optionalString isAarch64Darwin ''
                  if command -v colima &>/dev/null; then
                    echo "  Start Colima with: colima start"
                  else
                    echo "  Start Docker Desktop or install Colima"
                  fi
                ''}
                return 1
              fi

              ${pkgs.lib.optionalString isAarch64Darwin ''
                # only for arm64 macs - checks colima/docker info
                if docker context inspect colima &>/dev/null; then
                  colima status 2>&1 |grep -qi 'running' || {
                    echo "❌ ERROR: Colima context exists but not running"
                    echo "  Start with: colima start"
                    return 1
                  }
                  # In addition, validate DOCKER_HOST and TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE
                  local status=0
                  if [ -z "$DOCKER_HOST" -o -z "$TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE" ]; then
                    echo "❌ ERROR: DOCKER_HOST and/or TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE are not set"
                    echo "  Set these environment variables for example in your .envrc file (or .zshrc/.bashrc files):"
                    echo "    export DOCKER_HOST=\"unix://\$HOME/.colima/docker.sock\""
                    echo "    export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock"
                    echo ""
                    status=1
                  fi
                  # Verify "fake" docker symlink exists
                  if [ ! -L '/var/run/docker.sock' ]; then
                    echo "❌ ERROR: /var/run/docker.sock is not a symlink, run this to make testcontainers work with colima:"
                    echo "sudo ln -sf \$HOME/.colima/default/docker.sock /var/run/docker.sock"
                    echo ""
                    status=1
                  fi
                  return $status
                fi
              ''}
              return 0
            }

            ${pkgs.lib.optionalString isLinux ''
            check_podman() {
              if ! command -v podman &>/dev/null; then
                return 0
              fi

              echo "Validating Podman/Testcontainers setup (rootless)..."
              local sock="/run/user/$(id -u)/podman/podman.sock"
              local missing=0

              if [ -S "$sock" ]; then
                if [ ! -r "$sock" ]; then
                  echo "❌ Podman socket exists but is not readable: $sock"
                  missing=1
                fi
              else
                echo "❌ Podman socket not found at $sock"
                echo "  Start the podman service (e.g. 'podman system service --time=0 &' or your distro's unit)"
                missing=1
              fi

              if [ -z "$DOCKER_HOST" ] || [ -z "$TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE" ]; then
                echo "❌ Missing env for Testcontainers with Podman"
                echo "  export DOCKER_HOST=unix://$sock"
                echo "  export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=$sock"
                missing=1
              fi

              local tprops_project="$PWD/.testcontainers.properties"
              local tprops_home="$HOME/.testcontainers.properties"
              if [ ! -f "$tprops_project" ] && [ ! -f "$tprops_home" ]; then
                echo "❌ .testcontainers.properties not found (project root or \$HOME). Add:"
                echo "  docker.client.strategy=org.testcontainers.dockerclient.UnixSocketClientProviderStrategy"
                echo "  docker.host=unix://$sock"
                echo "  (Needed because /var/run/docker.sock may point to root-owned Podman sockets.)"
                missing=1
              fi

              if [ $missing -eq 0 ]; then
                echo "Podman/Testcontainers validated successfully"
              fi
              return $missing
            }
            ''}

            # Run validation check
            if ! check_docker; then
              echo "For Colima on Apple Silicon, fix all errors above and verify:"
              echo "  1. Install Colima: brew install colima # (or install via nix/home-manager)"
              echo "  2. Start Colima: colima start"
              echo "  3. Set Docker context: docker context use colima"
              echo "  4. verify environment and required symlinks"
            else
              echo "Docker environment validated successfully"
            fi

            ${pkgs.lib.optionalString isLinux ''
            # Run podman/Testcontainers guidance (does not fail the shell)
            check_podman || true
            ''}
          '';

          # Environment variables
          JAVA_HOME = "${jdk}";
          MAVEN_OPTS = "-Xmx2G";
        };

        # Provide packages individually if needed
        packages = {
          inherit jdk maven kotlin nodejs pnpm terraform google-cloud-sdk;
        };
      });
}
