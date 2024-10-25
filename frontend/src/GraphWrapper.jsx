import React, { useEffect, useRef } from 'react';
import { SigmaContainer, useSigma } from '@react-sigma/core';
import Graph from 'graphology';

// Define separate lists for central, parent, and child nodes
const centralNode = { id: 'n1', label: 'Ella Fitzgerald: 1917' };

const parentNodes = [
  { id: 'n2', label: 'n2 Sinatra: 1915' },
  { id: 'n3', label: 'n3 Holiday: 1915' },
  { id: 'n4', label: 'n4 Armstrong: 1901' },
  { id: 'n5', label: 'n5 Simone: 1933' }
];

const childNodes = [
  { id: 'n6', label: 'n6 King Cole: 1919' },
  { id: 'n7', label: 'n7 Porter: 1971' },
  { id: 'n8', label: 'n8 Vaughan: 1924' },
  { id: 'n9', label: 'n9 Bublé: 1975' }
];

const edges = [
  { source: 'n2', target: 'n1' },
  { source: 'n3', target: 'n1' },
  { source: 'n4', target: 'n1' },
  { source: 'n5', target: 'n1' },
  { source: 'n1', target: 'n6' },
  { source: 'n1', target: 'n7' },
  { source: 'n1', target: 'n8' },
  { source: 'n1', target: 'n9' }
];

const GraphComponent = () => {
  const sigma = useSigma();
  const containerRef = useRef(null);

  useEffect(() => {
    const graph = new Graph();
    
    // Add central node
    graph.addNode(centralNode.id, {
      label: centralNode.label,
      size: 20,
      color: 'black'
    });

    // Add parent nodes
    parentNodes.forEach(node => {
      graph.addNode(node.id, {
        label: node.label,
        size: 20,
        color: 'black'
      });
    });

    // Add child nodes
    childNodes.forEach(node => {
      graph.addNode(node.id, {
        label: node.label,
        size: 20,
        color: 'black'
      });
    });

    // Add edges
    edges.forEach(edge => {
      graph.addEdge(edge.source, edge.target);
    });

    // Central node position
    const centerX = 0;
    const centerY = 0;
    graph.setNodeAttribute(centralNode.id, 'x', centerX);
    graph.setNodeAttribute(centralNode.id, 'y', centerY);

    // Parent nodes (behind n1)
    const parentAngleSpread = Math.PI / 2; 
    const parentRadius = 100; 
    const parentStartAngle = 3 * Math.PI / 4; 

    parentNodes.forEach((node, index) => {
      const angle = parentStartAngle + (index * parentAngleSpread) / (parentNodes.length - 1);
      const x = centerX + parentRadius * Math.cos(angle);
      const y = centerY + parentRadius * Math.sin(angle);
      graph.setNodeAttribute(node.id, 'x', x);
      graph.setNodeAttribute(node.id, 'y', y);
    });

    // Child nodes (in front of n1)
    const childAngleSpread = Math.PI / 2; 
    const childRadius = 100; 
    const childStartAngle = 7 * Math.PI / 4;

    childNodes.forEach((node, index) => {
      const angle = childStartAngle + (index * childAngleSpread) / (childNodes.length - 1);
      const x = centerX + childRadius * Math.cos(angle);
      const y = centerY + childRadius * Math.sin(angle);
      graph.setNodeAttribute(node.id, 'x', x);
      graph.setNodeAttribute(node.id, 'y', y);
    });

    if (sigma) {
      sigma.setGraph(graph);
      sigma.refresh();
    }
  }, [sigma]);

  return <div ref={containerRef} />;
};

const GraphWrapper = () => (
  <SigmaContainer>
    <GraphComponent />
  </SigmaContainer>
);

export default GraphWrapper;
