import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
    try{
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(password,salt);
        return hashedPassword;

    }catch(error){
        throw new Error('Failed to has password');
    }
}

export const comparePassword = async (
    password: string,
    hashedPassword: string,
): Promise<boolean> => {
    const isMatch = await bcrypt.compare(password,hashedPassword);
    return isMatch;
}