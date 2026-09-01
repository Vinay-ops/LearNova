import { cn } from "@/lib/utils";

interface TreeNode {
  label: string;
  children?: TreeNode[];
}

interface IssueTreeNodeProps {
  node: TreeNode;
  level?: number;
}

export function IssueTreeNode({ node, level = 0 }: IssueTreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={cn("flex flex-col", level > 0 && "ml-6")}>
      <div className="relative flex items-center">
        {level > 0 && (
          <div className="absolute -left-6 top-0 h-full w-px bg-border" />
        )}
        {level > 0 && (
          <div className="absolute -left-6 top-1/2 h-px w-4 bg-border" />
        )}
        <div
          className={cn(
            "inline-flex items-center rounded-md border px-3 py-1.5 text-sm",
            level === 0
              ? "border-primary/30 bg-primary/5 font-semibold text-foreground"
              : hasChildren
              ? "border-border bg-muted/50 font-medium text-foreground"
              : "border-border bg-card text-muted-foreground"
          )}
        >
          {node.label}
        </div>
      </div>
      {hasChildren && (
        <div className="relative flex flex-col gap-2 mt-2">
          {node.children!.map((child, i) => (
            <IssueTreeNode key={i} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
