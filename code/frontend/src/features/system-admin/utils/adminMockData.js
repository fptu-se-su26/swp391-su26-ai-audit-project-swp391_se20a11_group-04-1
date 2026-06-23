export const MOCK_METRICS = [
    { id: 1, label: 'Total Users', value: '1,284', trend: '+86 this month', trendUp: true, icon: 'trending_up', iconColor: 'text-green-600' },
    { id: 2, label: 'Active Projects', value: '142', trend: '18 need review', trendUp: true, icon: 'assignment_late', iconColor: 'text-primary' },
    { id: 3, label: 'Active Mentors', value: '32', trend: '24 assigned', trendUp: true, icon: 'group', iconColor: 'text-on-surface-variant' },
    { id: 4, label: 'AI Requests', value: '24.8K', trend: '+12% this week', trendUp: true, icon: 'auto_awesome', iconColor: 'text-green-600' },
    { id: 5, label: 'Storage Used', value: '320 GB', trend: '68% of 500 GB', trendUp: true, icon: 'cloud', iconColor: 'text-on-surface-variant' },
    { id: 6, label: 'System Alerts', value: '7', trend: '3 high priority', trendUp: false, icon: 'warning', iconColor: 'text-error', valueColor: 'text-error' }
];

export const MOCK_CHART_DATA = [
    { name: 'Jan', users: 1000, projects: 50 },
    { name: 'Feb', users: 1200, projects: 70 },
    { name: 'Mar', users: 1500, projects: 90 },
    { name: 'Apr', users: 1700, projects: 120 },
    { name: 'May', users: 2000, projects: 130 },
    { name: 'Jun', users: 2400, projects: 142 }
];

export const MOCK_RECENT_ACTIVITY = [
    {
        id: 1,
        type: 'school',
        rawType: 'school',
        titleHTML: 'Context SWP391 - Summer 2026 created successfully',
        time: 'Just now',
        bgColor: 'bg-primary-container/10',
        textColor: 'text-primary'
    },
    {
        id: 2,
        type: 'person',
        rawType: 'person_add',
        titleHTML: 'New Mentor assigned: Dr. Alan Smith to 5 projects',
        time: '2 hours ago',
        bgColor: 'bg-tertiary-fixed',
        textColor: 'text-tertiary'
    },
    {
        id: 3,
        type: 'person',
        rawType: 'how_to_reg',
        titleHTML: 'User approved: sarah.j@student.edu verified',
        time: '4 hours ago',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700'
    },
    {
        id: 4,
        type: 'school',
        rawType: 'school',
        titleHTML: 'Project Mobile App - Group 3 passed review',
        time: 'Yesterday',
        bgColor: 'bg-primary-container/10',
        textColor: 'text-primary'
    }
];

export const MOCK_CRITICAL_ALERTS = [
    {
        id: 1,
        priorityLabel: 'High Priority',
        timeLabel: '48h overdue',
        title: 'Projects Need Mentor',
        desc: '5 projects are pending mentor assignment for over 48 hours.',
        btnText: 'Assign Mentors Now',
        level: 'high'
    },
    {
        id: 2,
        priorityLabel: 'Medium Priority',
        timeLabel: '22m ago',
        title: 'Inactive Projects',
        desc: '8 projects have shown no activity for 14+ days.',
        btnText: 'Review & Archive',
        level: 'medium'
    },
    {
        id: 3,
        priorityLabel: 'Medium Priority',
        timeLabel: '1h ago',
        title: 'High AI Usage Spike',
        desc: '+24% token consumption in last 4 hours.',
        btnText: 'View AI Monitor',
        level: 'ai'
    }
];
