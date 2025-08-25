export const getGreeting = (): { message: string; icon: string } => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return { message: 'Good morning!', icon: '🌅' };
  } else if (hour >= 12 && hour < 17) {
    return { message: 'Good afternoon!', icon: '☀️' };
  } else if (hour >= 17 && hour < 21) {
    return { message: 'Good evening!', icon: '🌆' };
  } else {
    return { message: 'Good night!', icon: '🌙' };
  }
};
