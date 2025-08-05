import React from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
    return (
        <div className='page-content-wrapper'>
            <div className='admin-dashboard'>
                <h2>Admin Dashboard</h2>
                <p>Welcome, Admin! Here you can manage various aspects of the Online Judge system.</p>
                <div className="admin-actions">
                    <h3>Problem Management</h3>
                    <ul>
                        <li><Link to="/admin/problems" className="card-link problems">View/Manage Problems</Link></li>
                        <li><Link to="/admin/problems/add" className="card-link problems">Add New Problem</Link></li>
                    </ul>
                    <h3>User Management</h3>
                    <ul>
                        <li><Link to="/admin/users" className="card-link users">View/Manage Users</Link></li>
                    </ul>
                    <h3>Competition Management</h3>
                    <ul>
                        <li><Link to="/admin/competitions" className="card-link competitions">View/Manage Competitions</Link></li>
                        <li><Link to="/admin/competitions/add" className="card-link competitions">Add New Competition</Link></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;