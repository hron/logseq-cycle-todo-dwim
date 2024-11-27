{ pkgs ? import <nixpkgs> { config = { allowUnfree = true; }; } }:

with pkgs; mkShell {
  name = "logseq-cycle-todo-dwim";

  buildInputs = [
    nodejs_18
    yarn
    bashInteractive
  ];
}
