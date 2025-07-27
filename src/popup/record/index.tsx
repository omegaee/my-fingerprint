import { Card, Tree, type TreeDataNode } from 'antd';
import { useEffect, useState } from 'react';
import { FpNoticeItem } from './item';

type FpNoticePanelProps = {
  notice?: Record<string, number>
}

export const FpNoticePanel = function ({ notice }: FpNoticePanelProps) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);

  const totalCount = (prefix: string) => {
    let count = 0;
    for (const key in notice) {
      if (key.startsWith(prefix)) {
        count += notice[key]
      }
    }
    return count;
  }

  useEffect(() => {
    if (!notice) return;

    const rootNodes: Record<string, TreeDataNode> = {}
    const nodeMap = new Map<string, TreeDataNode>()
    const countMap = new Map<string, number>()

    for (const fullPath in notice) {
      const count = notice[fullPath]
      const paths = fullPath.split('.')
      let parentKey = ''
      let parentNode: TreeDataNode | undefined;

      for (let i = 0; i < paths.length; i++) {
        const path = paths[i]
        let currKey: string;
        let currNode: TreeDataNode | undefined;

        // 准备key
        if (i === 0) {
          currKey = path
        } else {
          currKey = `${parentKey}.${path}`;
        }

        // 准备node
        currNode = nodeMap.get(currKey)
        if (!currNode) {
          if (i === paths.length - 1) {
            // 叶子节点
            currNode = {
              key: currKey,
              title: <FpNoticeItem title={path} count={count} isRoot={i === 0} />,
              isLeaf: true,
            }
          } else {
            // 非叶子节点
            currNode = {
              key: currKey,
              title: <FpNoticeItem title={path} count={totalCount(currKey)} isRoot={i === 0} />,
              children: [],
            }
          }
        }

        // 添加到树
        const pc = parentNode?.children
        if (i !== 0 && pc && !pc.some(v => v.key === currNode.key)) {
          pc.push(currNode)
        }
        else if (i === 0 && !rootNodes[currNode.key as any]) {
          rootNodes[currNode.key as any] = currNode
        }

        // 准备下次遍历
        nodeMap.set(currKey, currNode)
        countMap.set(currKey, (countMap.get(currKey) ?? 0) + count)
        parentKey = currKey;
        parentNode = currNode;
      }
    }

    const { strong, weak, other, ...rest } = rootNodes
    setTreeData([
      strong,
      weak,
      other,
      ...Object.values(rest),
    ])
    setExpandedKeys(Object.keys(rootNodes))
  }, [notice])

  return <div className='h-full flex flex-col'>
    {/* <div className='flex gap-2 items-center mb-2'>
      <Card size='small' className='grow'>{totalCount('strong.')}</Card>
      <Card size='small' className='grow'>{totalCount('weak.')}</Card>
      <Card size='small' className='grow'>{totalCount('other.')}</Card>
    </div> */}
    <Tree.DirectoryTree
      className='grow overflow-auto no-scrollbar'
      showIcon={false}
      blockNode
      treeData={treeData}
      expandedKeys={expandedKeys}
      onExpand={setExpandedKeys as any}
    />
  </div>
}