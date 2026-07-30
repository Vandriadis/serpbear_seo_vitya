import { render, screen } from '@testing-library/react';
import TopBar from '../../components/common/TopBar';
import { ThemeProvider } from '../../hooks/useTheme';

jest.mock('next/router', () => ({
   useRouter: () => ({
      pathname: '/',
   }),
}));

describe('TopBar Component', () => {
   it('renders without crashing', async () => {
       render(
          <ThemeProvider>
             <TopBar showSettings={jest.fn} showAddModal={jest.fn} />
          </ThemeProvider>,
       );
       expect(
           await screen.findByText('SerpBear'),
       ).toBeInTheDocument();
   });
});
