import Link from "next/link";

export function BackLink(props: { href: string; label?: string }) {
  return (
    <Link className="button-link subtle" href={props.href}>
      {props.label ?? "Back"}
    </Link>
  );
}

