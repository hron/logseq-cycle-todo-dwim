{ pkgs ? import <nixpkgs> { config = { allowUnfree = true; }; } }:

with pkgs; mkShell {
  name = "logseq-sample-plugin";

  buildInputs = [
    nodejs_20
    yarn
    bashInteractive
  ];
}
