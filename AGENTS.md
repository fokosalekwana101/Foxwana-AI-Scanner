<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- FOXWANA logic: AI (src/lib/ai, scan.functions.ts) only reports observations; the pure rule engine in src/lib/foxwana/rules.ts decides BUY/SELL/WAIT — keeps decisions testable and provider-independent.
- History/settings live in browser localStorage (thumbnails only, no full images) — no auth backend in v1.
- Keep the public scanner at `/`; authenticate named private pages at their leaf routes to avoid a root-path collision with a pathless auth layout.
