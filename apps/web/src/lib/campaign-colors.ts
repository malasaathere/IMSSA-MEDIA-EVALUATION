export type CampaignTone = {
  surface: string;
  row: string;
  tab: string;
  label: string;
};

export function getCampaignTone(campaign?: string): CampaignTone {
  const name = (campaign || '').toLowerCase();

  // Check Jr before hackX because both names contain "hackx".
  if (name.includes('hackx jr')) {
    return {
      surface: 'border-sky-300 bg-sky-50 hover:bg-sky-100',
      row: 'border-sky-300 bg-sky-50 hover:bg-sky-100',
      tab: 'border-sky-300 bg-sky-100 text-sky-900 hover:bg-sky-200',
      label: 'bg-sky-200 text-sky-950',
    };
  }

  if (name.includes('hackx')) {
    return {
      surface: 'border-blue-900 bg-blue-950 text-white hover:bg-blue-900',
      row: 'border-blue-900 bg-blue-50 hover:bg-blue-100',
      tab: 'border-blue-950 bg-blue-950 text-white hover:bg-blue-900',
      label: 'bg-blue-900 text-white',
    };
  }

  if (name.includes('exposition') || name.includes('expo')) {
    return {
      surface: 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100',
      row: 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100',
      tab: 'border-yellow-400 bg-yellow-300 text-yellow-950 hover:bg-yellow-400',
      label: 'bg-yellow-300 text-yellow-950',
    };
  }

  return {
    surface: 'border-slate-200 bg-white hover:bg-slate-50',
    row: 'border-slate-200 bg-white hover:bg-slate-50',
    tab: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    label: 'bg-slate-100 text-slate-800',
  };
}
