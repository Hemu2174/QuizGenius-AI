import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  BrainCircuit,
  Target,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'

export default function Analytics() {
  // Empty data structures representing the real state in Phase 1
  const topicData = []
  const scoreHistoryData = []
  const weakTopics = []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Learning Analytics"
        description="Track quiz performance, identify diagnostic knowledge gaps, and follow your topic mastery."
        badge="Zero-Data Baseline"
      />

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Accuracy"
          value="0%"
          subtitle="Awaiting first quiz submission"
          icon={Target}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          isZeroState={true}
        />
        <StatCard
          title="Completed Quizzes"
          value="0"
          subtitle="No attempts recorded"
          icon={BrainCircuit}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          isZeroState={true}
        />
        <StatCard
          title="Weak Topics Flagged"
          value="0"
          subtitle="Diagnosed after evaluations"
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          isZeroState={true}
        />
        <StatCard
          title="Mastered Topics"
          value="0"
          subtitle="Requires >80% score in topic"
          icon={Award}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          isZeroState={true}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic-wise Performance Chart Container */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Topic-Wise Accuracy (%)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of mastery levels across subject topics.
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="flex-1 min-h-[260px] flex items-center justify-center border border-dashed border-slate-200 rounded-lg p-6 bg-slate-50/50">
            {topicData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topicData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="topic" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center max-w-xs">
                <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-slate-700">No Topic Data Available</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Topic mastery bars will populate automatically after your first completed quiz attempt.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Score History Chart Container */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Score Progression Over Time
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Trendline of test performance across sequential sessions.
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="flex-1 min-h-[260px] flex items-center justify-center border border-dashed border-slate-200 rounded-lg p-6 bg-slate-50/50">
            {scoreHistoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={scoreHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center max-w-xs">
                <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-slate-700">No History Logged</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Your historical trajectory chart will display once quiz scores are recorded.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weak-Topic Analysis Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              AI Weak-Topic Diagnostic Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies subject concepts requiring targeted reinforcement based on quiz mistake patterns.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            0 Flagged Topics
          </span>
        </div>

        {weakTopics.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No weak topics identified yet"
            description="When you take quizzes, QuizGenius AI evaluates your answers to pinpoint concepts that need extra review, paired with targeted explanations and follow-up recommendations."
            className="border-dashed bg-slate-50/50 py-10 shadow-none"
          />
        ) : (
          <div className="space-y-3">
            {/* Weak topics will be rendered here */}
          </div>
        )}
      </div>
    </div>
  )
}

