import React from 'react';

/**
 * EvidenceStats — Summary cards hiển thị thống kê tổng quan Evidence
 */
const EvidenceStats = ({ stats = {} }) => {
  const {
    total = 0,
    pending = 0,
    accepted = 0,
    rejected = 0,
  } = stats;

  const cards = [
    {
      label: 'Total Evidence',
      value: total,
      icon: 'inventory_2',
      color: 'text-primary',
      bg: 'bg-primary-fixed/20',
    },
    {
      label: 'Pending Review',
      value: pending,
      icon: 'schedule',
      color: 'text-[#b06000]',
      bg: 'bg-[#fef7e0]',
    },
    {
      label: 'Accepted',
      value: accepted,
      icon: 'check_circle',
      color: 'text-[#137333]',
      bg: 'bg-[#e6f4ea]',
    },
    {
      label: 'Rejected',
      value: rejected,
      icon: 'cancel',
      color: 'text-error',
      bg: 'bg-error-container/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-stack_lg">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
        >
          <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
            <span className={`material-symbols-outlined ${card.color} text-[22px]`}>{card.icon}</span>
          </div>
          <div>
            <p className="font-display-lg text-[22px] leading-tight text-on-surface font-bold">{card.value}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EvidenceStats;
