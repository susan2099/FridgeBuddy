import {Link} from 'react-router-dom';
// import { useState, useEffect } from 'react';

export default function Settings() {
	return (
		<>
			<h1 style={{
				textAlign: "left",
				// alignSelf:"flex-start",
			}}>Settings</h1>

			<Link to="/">
				<button style={{ display: "block", margin: "auto" }}>Back</button>
			</Link>			
		</>
	);
}