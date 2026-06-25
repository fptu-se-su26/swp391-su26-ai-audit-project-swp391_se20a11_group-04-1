import React from 'react';
import { 
  SiReact, 
  SiSpringboot, 
  SiPostgresql, 
  SiDocker, 
  SiNginx, 
  SiGithubactions, 
  SiSonarqubecloud, // SonarQube Cloud / SonarCloud
  SiPrometheus, 
  SiGrafana, 
  SiTelegram, 
  SiLetsencrypt, 
  SiPython, 
  SiFastapi, 
  SiNodedotjs, 
  SiMongodb, 
  SiApachekafka, 
  SiGo, 
  SiRedis, 
  SiHtml5, 
  SiCss,
  SiJavascript, 
  SiTypescript, 
  SiKubernetes, 
  SiVite, 
  SiGithub, 
  SiTrivy,          // Trivy scan
  SiNextdotjs, 
  SiNestjs, 
  SiDjango, 
  SiFlask, 
  SiPostman, 
  SiSlack,
  SiSonar           // Generic Sonar
} from 'react-icons/si';
import { FaAws, FaAmazon, FaJava, FaCreditCard } from 'react-icons/fa';
import { Server, HelpCircle } from 'lucide-react';

const ICON_MAP = {
  react: { icon: SiReact, color: 'text-sky-500' },
  springboot: { icon: SiSpringboot, color: 'text-emerald-500' },
  postgresql: { icon: SiPostgresql, color: 'text-blue-600' },
  docker: { icon: SiDocker, color: 'text-sky-600' },
  nginx: { icon: SiNginx, color: 'text-emerald-600' },
  githubactions: { icon: SiGithubactions, color: 'text-blue-500' },
  sonarcloud: { icon: SiSonarqubecloud, color: 'text-orange-500' },
  sonarqube: { icon: SiSonar, color: 'text-orange-500' },
  sonar: { icon: SiSonar, color: 'text-orange-500' },
  prometheus: { icon: SiPrometheus, color: 'text-orange-600' },
  grafana: { icon: SiGrafana, color: 'text-orange-400' },
  amazonec2: { icon: FaAws, color: 'text-orange-500' },
  aws: { icon: FaAws, color: 'text-orange-400' },
  amazon: { icon: FaAmazon, color: 'text-orange-500' },
  telegram: { icon: SiTelegram, color: 'text-sky-400' },
  letsencrypt: { icon: SiLetsencrypt, color: 'text-sky-700' },
  python: { icon: SiPython, color: 'text-yellow-500' },
  fastapi: { icon: SiFastapi, color: 'text-teal-500' },
  nodejs: { icon: SiNodedotjs, color: 'text-emerald-500' },
  mongodb: { icon: SiMongodb, color: 'text-emerald-600' },
  kafka: { icon: SiApachekafka, color: 'text-slate-600' },
  java: { icon: FaJava, color: 'text-red-500' },
  golang: { icon: SiGo, color: 'text-sky-400' },
  redis: { icon: SiRedis, color: 'text-red-600' },
  plaid: { icon: FaCreditCard, color: 'text-black dark:text-white' },
  html: { icon: SiHtml5, color: 'text-orange-500' },
  css: { icon: SiCss, color: 'text-blue-500' },
  javascript: { icon: SiJavascript, color: 'text-yellow-400' },
  typescript: { icon: SiTypescript, color: 'text-blue-600' },
  kubernetes: { icon: SiKubernetes, color: 'text-blue-500' },
  vite: { icon: SiVite, color: 'text-purple-500' },
  github: { icon: SiGithub, color: 'text-slate-800 dark:text-slate-200' },
  trivy: { icon: SiTrivy, color: 'text-blue-500' },
  nextjs: { icon: SiNextdotjs, color: 'text-black dark:text-white' },
  nestjs: { icon: SiNestjs, color: 'text-red-600' },
  django: { icon: SiDjango, color: 'text-emerald-800' },
  flask: { icon: SiFlask, color: 'text-slate-700 dark:text-slate-300' },
  postman: { icon: SiPostman, color: 'text-orange-500' },
  slack: { icon: SiSlack, color: 'text-purple-600' },
};

export function TechIcon({ iconKey, size = 20, className = '' }) {
  if (!iconKey) {
    return <Server size={size} className={`text-slate-400 ${className}`} />;
  }

  const key = iconKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  const mapping = ICON_MAP[key];

  if (!mapping) {
    return <HelpCircle size={size} className={`text-slate-400 ${className}`} />;
  }

  const IconComp = mapping.icon;
  return <IconComp size={size} className={`${mapping.color} ${className}`} />;
}
