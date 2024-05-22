# Hinode Module - Mermaid

<!-- Tagline -->
<p align="center">
    <b>A Hugo module to add diagrams and charts powered by Mermaid to your Hinode site</b>
    <br />
</p>

<!-- Badges -->
<p align="center">
    <a href="https://gohugo.io" alt="Hugo website">
        <img src="https://img.shields.io/badge/generator-hugo-brightgreen">
    </a>
    <a href="https://gethinode.com" alt="Hinode theme">
        <img src="https://img.shields.io/badge/theme-hinode-blue">
    </a>
    <a href="https://github.com/gethinode/mod-mermaid/commits/main" alt="Last commit">
        <img src="https://img.shields.io/github/last-commit/gethinode/mod-mermaid.svg">
    </a>
    <a href="https://github.com/gethinode/mod-mermaid/issues" alt="Issues">
        <img src="https://img.shields.io/github/issues/gethinode/mod-mermaid.svg">
    </a>
    <a href="https://github.com/gethinode/mod-mermaid/pulls" alt="Pulls">
        <img src="https://img.shields.io/github/issues-pr-raw/gethinode/mod-mermaid.svg">
    </a>
    <a href="https://github.com/gethinode/mod-mermaid/blob/main/LICENSE" alt="License">
        <img src="https://img.shields.io/github/license/gethinode/mod-mermaid">
    </a>
</p>

## About

![Logo](https://raw.githubusercontent.com/gethinode/hinode/main/static/img/logo.png)

Hinode is a clean blog theme for [Hugo][hugo], an open-source static site generator. Hinode is available as a [template][repository_template], and a [main theme][repository]. This repository maintains a Hugo module to add [Mermaid][mermaid] to a Hinode site. Visit the Hinode documentation site for [installation instructions][hinode_docs].

## Usage

The module is "optional" per default. In this case the module must be enabled in the frontmatter of the pages that use mermaid by adding: `modules: ["mermaid"]`

Mermaid can be used in fenced codeblocks:

<pre>
```mermaid
YOUR DIAGRAMS
```
</pre>

or as shortcode:

<pre>
{{< mermaid >}}
YOUR DIAGRAM
{{< /mermaid >}}
</pre>

The module supports dark mode and allows creation of a custom mermaid theme by overriding and setting the theme variables in `assets/scss/mermaid.scss`. Checkout the [mermaid docs](https://mermaid.js.org/config/theming.html) for custom styling. All theme variables can be used, but in kebab case and with prefix as shown in the example below. Also bootstrap theme variables can be referenced.

```scss
// assets/scss/mermaid.scss

[data-mermaid-theme="light"] {
    // The Mermaid Theme (only 'base' does support custom theming)
    --mermaid-theme: 'base';
    // General Theme Variables
    --mermaid-dark-mode: false;
    --mermaid-background: var(--bs-body-bg);
    --mermaid-font-family: var(--bs-font-sans-serif);
    //...
}

[data-mermaid-theme="dark"] {
    // The Mermaid Theme (only 'base' does support custom theming)
    --mermaid-theme: 'base';
    // General Theme Variables
    --mermaid-dark-mode: true;
    --mermaid-background: var(--bs-body-bg);
    --mermaid-font-family: var(--bs-font-sans-serif);
    //...
}
```

## Contributing

This module uses [semantic-release][semantic-release] to automate the release of new versions. The package uses `husky` and `commitlint` to ensure commit messages adhere to the [Conventional Commits][conventionalcommits] specification. You can run `npx git-cz` from the terminal to help prepare the commit message.

<!-- ## Configuration

This module supports the following parameters (see the section `params.modules` in `config.toml`):

| Setting                   | Default | Description |
|---------------------------|---------|-------------| -->

<!-- MARKDOWN LINKS -->
[hugo]: https://gohugo.io
[hinode_docs]: https://gethinode.com
[mermaid]: https://mermaid.js.org
[repository]: https://github.com/gethinode/hinode.git
[repository_template]: https://github.com/gethinode/template.git
[conventionalcommits]: https://www.conventionalcommits.org
[husky]: https://typicode.github.io/husky/
[semantic-release]: https://semantic-release.gitbook.io/
