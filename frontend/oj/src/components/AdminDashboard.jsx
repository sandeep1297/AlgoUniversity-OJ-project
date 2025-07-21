import React from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Welcome, Admin! Here you can manage various aspects of the Online Judge system.</p>
      <div className="admin-actions">
        <h3>Problem Management</h3>
        <ul>
          <li><Link to="/admin/problems">View/Manage Problems</Link></li>
          <li><Link to="/admin/problems/add">Add New Problem</Link></li>
        </ul>
        <h3>User Management</h3>
        <ul>
          <li><Link to="/admin/users">View/Manage Users</Link></li>
        </ul>
        <h3>Competition Management</h3> {/* <-- NEW SECTION */}
        <ul>
          <li><Link to="/admin/competitions">View/Manage Competitions</Link></li> {/* <-- NEW LINK */}
          <li><Link to="/admin/competitions/add">Add New Competition</Link></li> {/* <-- NEW LINK */}
        </ul>
      </div>
    </div>
  );
}

export default AdminDashboard;