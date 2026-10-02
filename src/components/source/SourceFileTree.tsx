"use client";

import React, { useState } from "react";
import { SourceTreeNode } from "@/types";
import { Folder, FolderOpen, FileCode, ChevronRight, ChevronDown } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

interface SourceFileTreeProps {
  tree: SourceTreeNode[];
  selectedPath: string;
  onSelectFile: (path: string) => void;
}

interface TreeNodeItemProps {
  node: SourceTreeNode;
  selectedPath: string;
  onSelectFile: (path: string) => void;
  depth?: number;
}

function TreeNodeItem({ node, selectedPath, onSelectFile, depth = 0 }: TreeNodeItemProps) {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const isSelected = selectedPath === node.path;
  const isDirectory = node.type === "directory";

  const handleClick = () => {
    if (isDirectory) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node.path);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={cn(
          "flex items-center justify-between py-1.5 pr-2 rounded-md cursor-pointer text-xs select-none transition-colors group",
          isSelected
            ? "bg-brand-50 text-brand-700 font-medium"
            : "text-neutral-700 hover:bg-neutral-100"
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          {isDirectory ? (
            <span className="text-neutral-400 group-hover:text-neutral-600">
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
          ) : (
            <span className="w-3.5" />
          )}

          {isDirectory ? (
            isOpen ? (
              <FolderOpen className="w-4 h-4 text-brand-500 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-brand-500 shrink-0" />
            )
          ) : (
            <FileCode className="w-4 h-4 text-neutral-400 group-hover:text-brand-500 shrink-0" />
          )}

          <span className="truncate">{node.name}</span>
        </div>

        {!isDirectory && node.size !== undefined && (
          <span className="text-[10px] text-neutral-400 font-mono shrink-0 ml-2">
            {formatBytes(node.size, 0)}
          </span>
        )}
      </div>

      {isDirectory && isOpen && node.children && (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SourceFileTree({ tree, selectedPath, onSelectFile }: SourceFileTreeProps) {
  if (!tree || tree.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-neutral-400">
        No files in repository
      </div>
    );
  }

  return (
    <div className="space-y-0.5 py-1">
      {tree.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  );
}
