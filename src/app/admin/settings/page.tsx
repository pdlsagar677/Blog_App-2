// app/admin/settings/page.tsx
export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Site Maintenance</h4>
              <p className="text-sm text-gray-600">Put the site in maintenance mode</p>
            </div>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition-colors">
              Enable-Not Accessible now 
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Clear Cache</h4>
              <p className="text-sm text-gray-600">Clear all cached data</p>
            </div>
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors">
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}