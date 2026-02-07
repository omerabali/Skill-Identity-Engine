import { motion } from "framer-motion";
import SkillNode from "./SkillNode";

const SkillGraph = () => {
  const skills = [
    { name: "React", confidence: 92, x: 50, y: 25, size: "lg" as const },
    { name: "TypeScript", confidence: 88, x: 25, y: 40, size: "lg" as const },
    { name: "Node.js", confidence: 75, x: 75, y: 45, size: "md" as const },
    { name: "Python", confidence: 65, x: 15, y: 65, size: "md" as const },
    { name: "SQL", confidence: 70, x: 60, y: 70, size: "md" as const },
    { name: "Docker", confidence: 55, x: 85, y: 25, size: "sm" as const },
    { name: "AWS", confidence: 45, x: 35, y: 75, size: "sm" as const },
  ];

  const connections = [
    { from: { x: 50, y: 25 }, to: { x: 25, y: 40 } },
    { from: { x: 50, y: 25 }, to: { x: 75, y: 45 } },
    { from: { x: 25, y: 40 }, to: { x: 15, y: 65 } },
    { from: { x: 75, y: 45 }, to: { x: 60, y: 70 } },
    { from: { x: 50, y: 25 }, to: { x: 85, y: 25 } },
    { from: { x: 60, y: 70 }, to: { x: 35, y: 75 } },
  ];

  return (
    <div className="relative w-full h-[400px] md:h-[500px]">
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        {connections.map((conn, i) => (
          <motion.line
            key={i}
            x1={`${conn.from.x}%`}
            y1={`${conn.from.y}%`}
            x2={`${conn.to.x}%`}
            y2={`${conn.to.y}%`}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeDasharray="4,4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
          />
        ))}
      </svg>

      {/* Skill nodes */}
      {skills.map((skill, i) => (
        <SkillNode
          key={skill.name}
          {...skill}
          delay={0.2 + i * 0.15}
        />
      ))}
    </div>
  );
};

export default SkillGraph;