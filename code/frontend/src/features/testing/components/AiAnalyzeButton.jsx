import React, { useState } from 'react';
import axiosInstance from '@api/axiosConfig';
import { Bot, X } from 'lucide-react';

export default function AiAnalyzeButton({ testRunId }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const { data } = await axiosInstance.post(`/v1/test-runs/${testRunId}/analyze-error`);
            setAnalysis(data.data);
            setOpen(true);
        } catch (err) {
            setAnalysis('Không thể phân tích lỗi lúc này. Có thể chưa cấu hình API Key.');
            setOpen(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-2">
            <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E707D]/10 text-[#1E707D] border border-indigo-200 rounded-md text-[11px] font-medium hover:bg-indigo-100 transition-colors"
            >
                {loading ? (
                    <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Bot size={14} />
                )}
                {loading ? 'Đang phân tích...' : 'AI Phân Tích'}
            </button>

            {open && analysis && (
                <div className="mt-3 p-4 bg-[#1E707D]/10 border border-indigo-200 rounded-md text-[12px] text-indigo-900 leading-relaxed shadow-sm relative">
                    <button 
                        onClick={() => setOpen(false)}
                        className="absolute top-2 right-2 p-1 text-indigo-400 hover:text-[#1E707D] hover:bg-indigo-100 rounded-full transition-colors"
                    >
                        <X size={14} />
                    </button>
                    <div className="flex items-center gap-1.5 font-bold mb-2 text-indigo-800 text-[13px]">
                        <Bot size={16} /> AI Phân Tích
                    </div>
                    <div className="whitespace-pre-wrap">
                        {analysis}
                    </div>
                </div>
            )}
        </div>
    );
}
