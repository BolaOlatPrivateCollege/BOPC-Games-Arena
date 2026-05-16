import { useState } from 'react'
import Header from '../components/Header'

/**
 * Admin Dashboard Placeholder Component
 * For future admin features like moderation, game settings, analytics
 */
export default function AdminDashboard({ username, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'players', label: 'Players', icon: '👥' },
    { id: 'games', label: 'Games', icon: '🎮' },
    { id: 'moderation', label: 'Moderation', icon: '🛡️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={username} onLogout={onLogout} />

      <div className="container-custom py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">⚙️ Admin Dashboard</h1>
          <p className="text-xl text-gray-600">Manage BOPC Games Arena</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-lg">
                  <p className="text-4xl font-bold mb-2">0</p>
                  <p className="text-sm opacity-90">Active Players</p>
                </div>
                <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-6 rounded-lg">
                  <p className="text-4xl font-bold mb-2">0</p>
                  <p className="text-sm opacity-90">Active Rooms</p>
                </div>
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-6 rounded-lg">
                  <p className="text-4xl font-bold mb-2">0</p>
                  <p className="text-sm opacity-90">Games Played</p>
                </div>
                <div className="bg-gradient-to-br from-pink-400 to-pink-600 text-white p-6 rounded-lg">
                  <p className="text-4xl font-bold mb-2">0</p>
                  <p className="text-sm opacity-90">Reported Issues</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Player Management</h2>
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
                <p className="text-blue-800">
                  📋 Player management features coming in future versions
                </p>
              </div>
            </div>
          )}

          {activeTab === 'games' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Game Management</h2>
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
                <p className="text-blue-800">
                  🎮 Game management features coming in future versions
                </p>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Moderation Tools</h2>
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
                <p className="text-blue-800">
                  🛡️ Moderation tools coming in future versions
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">System Settings</h2>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-bold text-gray-800 mb-2">Game Configuration</h3>
                  <p className="text-gray-600 text-sm">Tic Tac Toe: Max players per room = 2</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-bold text-gray-800 mb-2">Server Status</h3>
                  <p className="text-green-600 text-sm">✅ All systems operational</p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Database</h3>
                  <p className="text-gray-600 text-sm">MongoDB: Connected</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            ℹ️ <strong>Note:</strong> This is a placeholder admin dashboard. Full moderation and management features will be added in future versions.
          </p>
        </div>
      </div>
    </div>
  )
}
