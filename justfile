build: build-core build-react

build-react:
  cd packages/anode-react && pnpm build

build-core:
  pnpm build

