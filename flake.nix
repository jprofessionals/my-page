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
        npm = pkgs.nodePackages.npm;

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
            npm

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
            echo "- npm: $(npm --version)"
            echo "- Terraform: $(terraform version | head -n 1)"
            echo "- Google Cloud SDK: $(gcloud --version | head -n 1)"
            echo ""
            echo "Quick start:"
            echo "- Backend: cd my-page-api && mvn spring-boot:run"
            echo "- Frontend: cd my-page-app && npm install && npm run dev"
            echo "- Infrastructure: cd infrastructure && terraform init"
            echo ""
          '';

          # Environment variables
          JAVA_HOME = "${jdk}";
          MAVEN_OPTS = "-Xmx2G";
          GOOGLE_APPLICATION_CREDENTIALS = "$PWD/infrastructure/credentials.json";
        };

        # Provide packages individually if needed
        packages = {
          inherit jdk maven kotlin nodejs npm terraform google-cloud-sdk;
        };
      });
}
