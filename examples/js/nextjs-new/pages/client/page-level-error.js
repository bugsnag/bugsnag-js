if (typeof window !== "undefined") {
  throw new Error(
    "Error thrown during top-level page rendering client-side (if you see this message in the ErrorBoundary, everything works as expected)."
  );
}

const PageLevelError = () => {
  return (
	<section>
		<h1>Page Level Error</h1>
		<p>Error thrown during top-level page rendering client-side</p>
	</section>
	);
}

export default PageLevelError;
