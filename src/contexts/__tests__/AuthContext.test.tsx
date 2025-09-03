import { render, screen, waitFor } from '@testing-library/react';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock Firebase functions
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;

// Test component to use the hook
function TestComponent() {
  const { user, userData, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <div>User: {user ? user.email : 'Not logged in'}</div>
      <div>User Type: {userData ? userData.type : 'No user data'}</div>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide loading state initially', () => {
    // Mock auth state change to not call the callback immediately
    mockOnAuthStateChanged.mockImplementation(() => jest.fn());

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle authenticated user with user data', async () => {
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
    };

    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com',
      type: 'club',
      profileCompleted: true,
      createdAt: null,
    };

    // Mock successful auth state change
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      // Call the callback with the mock user
      callback(mockUser as any);
      // Return unsubscribe function
      return jest.fn();
    });

    // Mock successful Firestore document fetch
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockUserData,
    } as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
    expect(screen.getByText('User Type: club')).toBeInTheDocument();
  });

  it('should handle unauthenticated user', async () => {
    // Mock auth state change with null user
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('User: Not logged in')).toBeInTheDocument();
    expect(screen.getByText('User Type: No user data')).toBeInTheDocument();
  });

  it('should handle authenticated user without Firestore document', async () => {
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
    };

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser as any);
      return jest.fn();
    });

    // Mock Firestore document not existing
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    } as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
    expect(screen.getByText('User Type: No user data')).toBeInTheDocument();
  });

  it('should handle Firestore errors gracefully', async () => {
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
    };

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser as any);
      return jest.fn();
    });

    // Mock Firestore error
    mockGetDoc.mockRejectedValue(new Error('Firestore error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('User: Not logged in')).toBeInTheDocument();
    expect(screen.getByText('User Type: No user data')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('Error in auth state change:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should throw error when useAuth is used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});