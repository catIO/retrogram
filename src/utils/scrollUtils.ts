/**
 * Checks if the user has scrolled to the bottom of the page
 * @param threshold - The distance from the bottom (in pixels) to trigger the callback
 * @returns true if the user has scrolled to the bottom, false otherwise
 */
export const isScrolledToBottom = (threshold: number = 100): boolean => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = document.documentElement.clientHeight;
  
  return scrollTop + clientHeight >= scrollHeight - threshold;
};

/**
 * Adds a scroll event listener to detect when the user has scrolled to the bottom
 * @param callback - Function to call when the user has scrolled to the bottom
 * @param threshold - The distance from the bottom (in pixels) to trigger the callback
 * @returns A function to remove the event listener
 */
export const addScrollToBottomListener = (
  callback: () => void,
  threshold: number = 100
): (() => void) => {
  const handleScroll = () => {
    if (isScrolledToBottom(threshold)) {
      callback();
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  
  // Return a function to remove the event listener
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}; 