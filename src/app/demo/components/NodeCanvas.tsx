'use client';

import React, { useState, useEffect } from 'react';
import { Circle, Arrow, Text, Shape, Group, Rect } from 'react-konva';
import Grid from './Grid';
import { NodeCanvasProps } from '../type';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';

// Define a type for the points returned by different calculation functions
type ArrowPoints = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

type CurvedArrowPoints = ArrowPoints & {
  controlX: number;
  controlY: number;
};

const NodeCanvas: React.FC<NodeCanvasProps> = ({
  nodes,
  showGrid,
  stageProps,
  nodeMap,
  highlightedTransition,
  selectedNode,
  finiteNodes,
  currNode,
  showQuestion,
  handleNodeClick,
  handleDragMove,
  nodeMouseDown,
  nodeMouseUp
}) => {
  // Add animation state
  const [animationProgress, setAnimationProgress] = useState<number>(0);

  // Animation effect for highlighted transitions
  useEffect(() => {
    if (!highlightedTransition || !highlightedTransition.d) return;
    
    let animationFrameId: number;
    let progress = 0;
    
    const animate = () => {
      progress += 0.02; // Speed of animation
      if (progress > 1) progress = 0;
      
      setAnimationProgress(progress);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [highlightedTransition]);

  // Node and transition rendering functions
  const calculateArrowPoints = (sourceX: number, sourceY: number, targetX: number, targetY: number, radius: number) => {
    const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
    const startX = sourceX + radius * Math.cos(angle);
    const startY = sourceY + radius * Math.sin(angle);
    const endX = targetX - (radius + 2) * Math.cos(angle);
    const endY = targetY - (radius + 2) * Math.sin(angle);

    return { startX, startY, endX, endY };
  };

  const calculateCurvedArrowPoints = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    radiusFactor: number,
    nodeRadius = 20
  ) => {
    const distance = Math.sqrt(
      Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)
    );
    const centerX = (sourceX + targetX) / 2;
    const centerY = (sourceY + targetY) / 2;
  
    const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
    const curveOffset = distance / radiusFactor;
  
    const controlX =
      centerX + curveOffset * Math.cos(angle + Math.PI / 2) * -1;
    const controlY =
      centerY + curveOffset * Math.sin(angle + Math.PI / 2) * -1;
  
    const angleToTarget = Math.atan2(targetY - controlY, targetX - controlX);
  
    const endX = targetX - (nodeRadius + 9) * Math.cos(angleToTarget);
    const endY = targetY - (nodeRadius + 9) * Math.sin(angleToTarget);
  
    const angleToSource = Math.atan2(sourceY - controlY, sourceX - controlX);
    const startX = sourceX - (nodeRadius + 9) * Math.cos(angleToSource);
    const startY = sourceY - (nodeRadius + 9) * Math.sin(angleToSource);
  
    return {
      startX,
      startY,
      endX,
      endY,
      controlX,
      controlY,
    };
  };

  const calculateCurveStrength = (x1: number, y1: number, x2: number, y2: number) => {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return Math.max(6, distance / 60);
  };

  // Function to draw animated edges
  const drawAnimatedEdge = (
    points: ArrowPoints | CurvedArrowPoints, 
    isCurved: boolean,
    progress: number, 
    color: string = "red"
  ) => {
    return (
      <Group perfectDrawEnabled={false}>
        {/* Base line - dotted */}
        {isCurved ? (
          <Shape
            sceneFunc={(context: Konva.Context) => {
              context.beginPath();
              context.moveTo(points.startX, points.startY);
              context.quadraticCurveTo(
                (points as CurvedArrowPoints).controlX, 
                (points as CurvedArrowPoints).controlY, 
                points.endX, 
                points.endY
              );
              
              // Set up dotted line
              context.setLineDash([5, 3]);
              context.strokeStyle = color;
              context.lineWidth = 2;
              context.stroke();
              context.setLineDash([]);
              
              // Draw arrowhead
              const arrowSize = 15;
              const angleToCenter = Math.atan2(
                points.endY - (points as CurvedArrowPoints).controlY, 
                points.endX - (points as CurvedArrowPoints).controlX
              );
              
              context.beginPath();
              context.moveTo(points.endX, points.endY);
              context.lineTo(
                points.endX - arrowSize * Math.cos(angleToCenter + Math.PI / 6),
                points.endY - arrowSize * Math.sin(angleToCenter + Math.PI / 6)
              );
              context.lineTo(
                points.endX - arrowSize * Math.cos(angleToCenter - Math.PI / 6),
                points.endY - arrowSize * Math.sin(angleToCenter - Math.PI / 6)
              );
              context.closePath();
              context.fillStyle = color;
              context.fill();
            }}
            perfectDrawEnabled={false}
          />
        ) : (
          <Shape
            sceneFunc={(context: Konva.Context) => {
              context.beginPath();
              context.moveTo(points.startX, points.startY);
              context.lineTo(points.endX, points.endY);
              
              // Set up dotted line
              context.setLineDash([5, 3]);
              context.strokeStyle = color;
              context.lineWidth = 2;
              context.stroke();
              context.setLineDash([]);
              
              // Draw arrowhead
              const arrowSize = 15;
              const angle = Math.atan2(
                points.endY - points.startY, 
                points.endX - points.startX
              );
              
              context.beginPath();
              context.moveTo(points.endX, points.endY);
              context.lineTo(
                points.endX - arrowSize * Math.cos(angle + Math.PI / 6),
                points.endY - arrowSize * Math.sin(angle + Math.PI / 6)
              );
              context.lineTo(
                points.endX - arrowSize * Math.cos(angle - Math.PI / 6),
                points.endY - arrowSize * Math.sin(angle - Math.PI / 6)
              );
              context.closePath();
              context.fillStyle = color;
              context.fill();
            }}
            perfectDrawEnabled={false}
          />
        )}
        
        {/* Animated particle moving along the edge */}
        {(() => {
          // Calculate position along the path based on progress
          let x, y;
          
          if (isCurved) {
            // Quadratic Bezier curve formula
            const t = progress;
            const p0x = points.startX;
            const p0y = points.startY;
            const p1x = (points as CurvedArrowPoints).controlX;
            const p1y = (points as CurvedArrowPoints).controlY;
            const p2x = points.endX;
            const p2y = points.endY;
            
            // B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
            const mt = 1 - t;
            x = mt * mt * p0x + 2 * mt * t * p1x + t * t * p2x;
            y = mt * mt * p0y + 2 * mt * t * p1y + t * t * p2y;
          } else {
            // Linear interpolation for straight lines
            x = points.startX + (points.endX - points.startX) * progress;
            y = points.startY + (points.endY - points.startY) * progress;
          }
          
          return (
            <Circle
              x={x}
              y={y}
              radius={5}
              fill={color}
              shadowBlur={10}
              shadowColor={color}
              shadowOpacity={0.6}
              perfectDrawEnabled={false}
            />
          );
        })()}
      </Group>
    );
  };

  // Updated self-loop drawing to include animation when highlighted
  const drawSelfLoop = (x: number, y: number, label: string, index: string, isHighlighted: boolean) => {
    const radius = 20;
    const loopRadius = 20;
    const angleOffset = Math.PI;
    const startAngle = -Math.PI - angleOffset;
    const endAngle = -Math.PI / 19 + angleOffset;
    const loopX = x;
    const loopY = y - radius - loopRadius;
    const arrowAngle = Math.PI / 18;

    return (
      <Group key={index} perfectDrawEnabled={false}>
        {/* Draw animated or regular loop based on highlight state */}
        {isHighlighted ? (
          <Shape
            sceneFunc={(context: Konva.Context) => {
              context.beginPath();
              context.arc(loopX, loopY, loopRadius, startAngle, endAngle, false);
              // Set up dotted line for animation
              context.setLineDash([5, 3]);
              context.strokeStyle = "red";
              context.lineWidth = 2;
              context.stroke();
              context.setLineDash([]);
              context.closePath();
            }}
            perfectDrawEnabled={false}
          />
        ) : (
          <Shape
            sceneFunc={(context: Konva.Context, shape: Konva.Shape) => {
              context.beginPath();
              context.arc(loopX, loopY, loopRadius, startAngle, endAngle, false);
              context.stroke();
              context.closePath();
              context.strokeShape(shape);
            }}
            stroke="black"
            strokeWidth={2}
            perfectDrawEnabled={false}
          />
        )}
        
        {/* Arrow for the self loop */}
        <Arrow
          points={[
            loopX + loopRadius * Math.cos(arrowAngle),
            loopY + loopRadius * Math.sin(arrowAngle),
            loopX + loopRadius * Math.cos(arrowAngle + Math.PI / 6),
            loopY + loopRadius * Math.sin(arrowAngle + Math.PI / 6),
          ]}
          stroke={isHighlighted ? "red" : "black"}
          fill={isHighlighted ? "red" : "black"}
          pointerLength={10}
          pointerWidth={10}
          perfectDrawEnabled={false}
        />
        
        {/* Animated particle for highlighted loops */}
        {isHighlighted && (
          <Circle
            x={loopX + loopRadius * Math.cos(startAngle + (endAngle - startAngle) * animationProgress)}
            y={loopY + loopRadius * Math.sin(startAngle + (endAngle - startAngle) * animationProgress)}
            radius={5}
            fill="red"
            shadowBlur={10}
            shadowColor="red"
            shadowOpacity={0.6}
            perfectDrawEnabled={false}
          />
        )}
        
        <Text
          x={loopX - label.length * 3 - 3}
          y={loopY - loopRadius - 18}
          text={label}
          fontSize={16}
          fill="black"
          align="center"
          verticalAlign="middle"
          perfectDrawEnabled={false}
        />
      </Group>
    );
  };

  // Helper function for curved arrow label position
  const calculateMidpointX = (startX: number, controlX: number, endX: number) => {
    return ((startX + 2 * controlX + endX) / 4 - 3);
  };
  
  const calculateMidpointY = (startY: number, controlY: number, endY: number) => {
    return (startY + 2 * controlY + endY) / 4 - 8;
  };

  // Create edges from all transitions
  const edges = nodes.flatMap(node => 
    node.transitions.map(transition => ({
      source: node,
      target: nodeMap[transition.targetid],
      label: transition.label
    }))
  ).filter(edge => edge.target); // Filter out any transitions to non-existent nodes
  
  return (
    <>
      {/* Grid Background */}
      {showGrid && <Grid size={20} color="#9c9c9c" stageProps={stageProps} />}

      {/* Draw all transitions */}
      {edges.map((edge, index) => {
        const isReverse = edges.some(
          otherEdge => 
            otherEdge.source.id === edge.target.id && 
            otherEdge.target.id === edge.source.id &&
            otherEdge !== edge
        );
        
        // Self-loop
        if (edge.source.id === edge.target.id) {
          const isHighlighted = highlightedTransition && 
            highlightedTransition.d?.targetid === edge.target.id && 
            highlightedTransition.d?.label === edge.label && 
            highlightedTransition.target === edge.source.id;
            
          return drawSelfLoop(edge.source.x, edge.source.y, edge.label, `${edge.source.id}-${index}`, isHighlighted);
        } 
        // Regular transition
        else {
          const points = isReverse
            ? calculateCurvedArrowPoints(
                edge.source.x,
                edge.source.y,
                edge.target.x,
                edge.target.y,
                calculateCurveStrength(
                  edge.source.x,
                  edge.source.y,
                  edge.target.x,
                  edge.target.y
                ),
                20
              )
            : calculateArrowPoints(
                edge.source.x,
                edge.source.y,
                edge.target.x,
                edge.target.y,
                30
              );
          
          const isHighlighted = highlightedTransition && 
            highlightedTransition.d?.targetid === edge.target.id && 
            highlightedTransition.d?.label === edge.label && 
            highlightedTransition.target === edge.source.id;
          
          return (
            <Group key={`${edge.source.id}-${edge.target.id}-${index}`} perfectDrawEnabled={false}>
              {/* Draw either animated or regular arrow based on highlight state */}
              {isHighlighted ? (
                drawAnimatedEdge(
                  points, 
                  isReverse,
                  animationProgress,
                  "red"
                )
              ) : (
                isReverse ? (
                  <>
                    <Shape
                      sceneFunc={(context: Konva.Context, _shape: Konva.Shape) => {
                        context.beginPath();
                        context.moveTo(points.startX, points.startY);
                        context.quadraticCurveTo(
                          (points as CurvedArrowPoints).controlX, 
                          (points as CurvedArrowPoints).controlY, 
                          points.endX, 
                          points.endY
                        );
                        context.stroke();
                        context.strokeShape(_shape);
                      }}
                      stroke="black"
                      strokeWidth={2}
                      perfectDrawEnabled={false}
                    />
                    <Shape
                      sceneFunc={(context: Konva.Context) => {
                        context.beginPath();
                        const arrowSize = 15;
                        const angleToCenter = Math.atan2(
                          edge.target.y - points.endY, 
                          edge.target.x - points.endX
                        );
                        context.moveTo(points.endX, points.endY);
                        context.lineTo(
                          points.endX - arrowSize * Math.cos(angleToCenter + Math.PI / 6),
                          points.endY - arrowSize * Math.sin(angleToCenter + Math.PI / 6)
                        );
                        context.lineTo(
                          points.endX - arrowSize * Math.cos(angleToCenter - Math.PI / 6),
                          points.endY - arrowSize * Math.sin(angleToCenter - Math.PI / 6)
                        );
                        context.closePath();
                        context.fillStyle = "black";
                        context.fill();
                      }}
                      perfectDrawEnabled={false}
                    />
                  </>
                ) : (
                  <Arrow
                    points={[
                      points.startX, 
                      points.startY, 
                      points.endX, 
                      points.endY
                    ]}
                    stroke="black"
                    fill="black"
                    pointerLength={10}
                    pointerWidth={10}
                    perfectDrawEnabled={false}
                  />
                )
              )}
              
              {/* Label Text */}
              <Group perfectDrawEnabled={false}>
                <Rect
                  x={isReverse 
                    ? calculateMidpointX(points.startX, (points as CurvedArrowPoints).controlX, points.endX) - (edge.label.length * 3.2) - 3
                    : (points.startX + points.endX - (edge.label.length * 6.5)) / 2 - 4
                  }
                  y={isReverse 
                    ? calculateMidpointY(points.startY, (points as CurvedArrowPoints).controlY, points.endY) - 5 
                    : (points.startY + points.endY) / 2 - 10
                  }
                  width={edge.label.length * 7 + 10}
                  height={20}
                  fill="white"
                  opacity={0.8}
                  cornerRadius={4}
                  perfectDrawEnabled={false}
                />
                <Text
                  x={isReverse 
                    ? calculateMidpointX(points.startX, (points as CurvedArrowPoints).controlX, points.endX) - (edge.label.length * 6) / 2 
                    : (points.startX + points.endX - (edge.label.length * 6)) / 2
                  }
                  y={isReverse 
                    ? calculateMidpointY(points.startY, (points as CurvedArrowPoints).controlY, points.endY) 
                    : (points.startY + points.endY - 15) / 2
                  }
                  text={edge.label}
                  fontSize={16}
                  fill="black"
                  align="center"
                  verticalAlign="middle"
                  perfectDrawEnabled={false}
                />
              </Group>
            </Group>
          );
        }
      })}

      {/* Draw all nodes */}
      {nodes.map((node) => (
        <Group 
          key={node.id}
          x={node.x}
          y={node.y}
          draggable
          onTap={() => handleNodeClick(node)}
          onClick={() => handleNodeClick(node)}
          onMouseDown={nodeMouseDown}
          onMouseUp={nodeMouseUp}
          onDragMove={(e: KonvaEventObject<DragEvent>) => {
            // Pass the Konva event directly to handleDragMove
            handleDragMove(e, node.id);
          }}
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
          className="react-konva-drag"
        >
          {showQuestion && currNode && (currNode.id === node.id) && (
            <Group>
              <Circle
                radius={15}
                fill="#fff"
                stroke="#70DAC2"
                strokeWidth={2}
                x={38}
                y={12}
              />
              <Text
                text="?"
                fontSize={20}
                fontStyle="bold"
                fill="#70DAC2"
                x={32}
                y={2}
                align="center"
                verticalAlign="middle"
              />
            </Group>
          )}
          
          {/* Start arrow for first state */}
          {node.id === 'q0' && (
            <Arrow
              points={[-70, 0, -32, 0]}
              stroke={currNode && currNode.id === node.id ? "red" : "black"}
              fill={currNode && currNode.id === node.id ? "red" : "black"}
              pointerLength={10}
              pointerWidth={10}
              perfectDrawEnabled={false}
            />
          )}
          
          {/* Node circle */}
          <Circle
            x={0}
            y={0}
            radius={30}
            fill={
              selectedNode 
                ? (selectedNode.id === node.id ? "rgba(207, 207, 255, 1.0)" : "white") 
                : (currNode && currNode.id === node.id 
                    ? (finiteNodes.has(currNode.id) ? "#32CD32" : "red") 
                    : "white")
            }
            stroke={
              selectedNode 
                ? (selectedNode.id === node.id ? "rgba(89, 89, 255, 1.0)" : "black") 
                : "black"
            }
            strokeWidth={selectedNode ? (selectedNode.id === node.id ? 2 : 1) : 1}
            perfectDrawEnabled={false}
          />
          
          {/* Final state second circle */}
          {finiteNodes.has(node.id) && (
            <Circle
              x={0}
              y={0}
              radius={25}
              stroke="black"
              strokeWidth={1}
              fill="transparent"
              perfectDrawEnabled={false}
            />
          )}
          
          {/* Node label */}
          <Text
            x={0 - node.id.length * 5 + 10}
            y={-7}
            text={node.id}
            fill={currNode ? (currNode.id === node.id ? "white" : "black") : "black"}
            fontSize={16}
            align="center"
            verticalAlign="middle"
            offsetX={8}
            perfectDrawEnabled={false}
          />
        </Group>
      ))}
    </>
  );
};

export default NodeCanvas;