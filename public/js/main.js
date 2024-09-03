document.addEventListener('DOMContentLoaded', function () {
	// set current year
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const footerYear = document.getElementById('footerCurrentYear');
	footerYear.textContent = currentYear;
});
