const borga_data_mem = require('../borga-data-mem')
const board_games_data = require('../board-games-data')
const services = require('../borga-services')(board_games_data, borga_data_mem) 

const error = require('../borga-errors')

// TESTS TEMPLATE FOR borga-data-mem 
/*
test('Description of the test here', () => {

    Examples to validate THIS test: 
    expect(test_value).toBe(null)
    or
    expect(test value).toStrictEqual({
        'name' : 'New Name',
        'games': []
    })
    or 
    https://jestjs.io/docs/expect

    services.deleteGroup()  // To avoid leaving unwanted groups to the next test
})
*/

const test_user = "Zé"
const test_token = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
services.connectTokenWithUser(test_token, test_user)

beforeEach(async () => { 
    await services.createUser(test_user) 
})
afterEach(async () => await services.resetAll())


describe('Group Tests', () => {
    

    test('Create group with empty name and description', async () => {
        try {
            await services.createGroup(test_user)
        } catch (err) {
            expect(err).toBe(error.DATA_MEM_INVALID_GROUP_NAME)
        }
    })

    test('Create group with valid details', async () => {
        await services.connectTokenWithUser(test_token, test_user)
        let newGroupID = await services.executeAuthed(test_token, 'createGroup', "New Valid Group Name", "New group description")
        expect(await services.getGroup(newGroupID)).toBeDefined()
    })

    // getGroup
    test('Get group that does not exist', async () => {
        try {
            await services.getGroup(2)
        } catch (err) {
            expect(err).toBe(error.DATA_MEM_GROUP_DOES_NOT_EXIST)
        }
    })

    // changeGroupName
    test('Change group name if new name is empty', async () => {
        let groupID = await services.createGroup(test_user, "Old Group", "New Description")
        try {
            await services.changeGroupName(test_user, groupID, "")
        } catch (err) {
            expect(err).toBe(error.DATA_MEM_INVALID_GROUP_NAME)
        }
    })

    test('Change group name if new name is not empty', async () => {
        let groupID = await services.createGroup(test_user, "Old Group", "New Description")
        await services.changeGroupName(test_user, groupID, "New Group Name")
        expect((await services.getGroup(groupID)).name).toBe("New Group Name")
    })

    test('Change group name from group that does not exist', async () => {
        try {
            await services.changeGroupName(1, "Something")
        } catch (err) {
            expect(err).toBe(error.DATA_MEM_GROUP_DOES_NOT_EXIST)
        }
    })

    // deleteGroup
    test('Try to delete a non existing group', async () => {
        try {
            await services.deleteGroup("A Group")
        } catch (err) {
            expect(err).toBe(error.DATA_MEM_GROUP_DOES_NOT_EXIST)
        }
    })

    test('Delete an existing group', async () => {
        let newGroupID = await services.createGroup(test_user, "New Group", "New Description")
        await services.deleteGroup(test_user, newGroupID)
        try {
            await services.getGroup(newGroupID)
        } catch (err) {
            // Expect group to not exist anymore
            expect(err).toBe(error.DATA_MEM_GROUP_DOES_NOT_EXIST)
        }
    })
})

describe('Group Games Tests', () => {

    jest.setTimeout(10 * 1000)
    afterEach(async () => services.resetAll())

    test('Add game to a valid group', async () => {
        await services.createUser(test_user)
        let newGroupID = await services.createGroup(test_user, "New Group", "New Description")
        expect(await services.addGameToGroupByID(test_user, newGroupID, 'TAAifFP590')).toBeDefined()
    })
    
    test('Add duplicate game to a group', async () => {
        let newGroupID = await services.createGroup(test_user, "New Group", "New Description")
        await services.addGameToGroupByID(test_user,newGroupID, 'TAAifFP590')
        try {
            await services.addGameToGroupByID(test_user, newGroupID, 'TAAifFP590')
        } catch (err) {
            expect(err).toBe(error.DATA_MEM_GROUP_ALREADY_HAS_GAME)
        }
    })
    
    test('Add game to a unexisting group', async () => {
        try {
            await services.addGameToGroupByID(test_user, 1, 'TAAifFP590')
        } catch (err) {
            expect(err).toBe(error.DATA_MEM_GROUP_DOES_NOT_EXIST)
        }
    })
    
    // getGroupGameNames
    test('Get game names from unexisting group', async () => {
        try {
            await services.getGroupGameNames(1234)
        } catch (err) {
            expect(err).toBe(error.DATA_MEM_GROUP_DOES_NOT_EXIST)
        }
    })
    
    // FIX THIS
    test('Get game names from valid group', async () => {
        let groupID = await services.createGroup(test_user, "New Group", "New Description")
        await services.addGameToGroupByID(test_user, groupID, '5H5JS0KLzK')
        await services.addGameToGroupByID(test_user, groupID, '8xos44jY7Q')
        expect(JSON.stringify(await services.getGroupGameNames(groupID))).toBe(JSON.stringify(["Wingspan", "Everdell"]))
    })
    
    // FIX THIS
    test('Delete Group Game from valid group', async () => {
        let groupID = await services.createGroup(test_user, "New Group", "New Description")
        let game = {
            'id': 'jhadHUIA',
            'name': "First"
        }
        await services.addGameToGroup(test_user, groupID, game)
        expect(await services.groupHasGame(groupID, game.id)).toBe(true)
        await services.deleteGameFromGroup(test_user, groupID, game.id)
        expect(await services.groupHasGame(groupID, game)).toBe(false)
    })
})

describe('User Operations Tests ', () => {

    afterEach(async () => services.resetAll())

    // Create User
    test('Create user', async () => {
        await services.createUser("Miguel")
        expect(await services.getUser("Miguel")).toBeDefined()
    })

    // Delete Existing User
    test('Delete an existing user', async () => {
        await services.createUser("Quim")
        try {
            await services.getUser("Quim")
            await services.deleteUser("Quim")
        } catch (err) {
            // Expect user to have been deleted successfully
            expect(err).toBe(error.DATA_MEM_USER_DOES_NOT_EXIST)
        }
    })

    // Delete Unexisting User
    test('Delete an unexisting user', async () => {
        try {
            await services.deleteUser("Quim")
        } catch (err) {
            // Expect user to not exist anymore
            expect(err).toBe(error.DATA_MEM_USER_DOES_NOT_EXIST)
        }
    })

    // Associate a group to a user
    test('Add group to a user', async () => {
        await services.createUser("Manuel")
        let newGroupID = await services.createGroup(test_user, "A", "B")
        await services.addGroupToUser("Manuel", newGroupID)
        let getUser = await services.getUser("Manuel")
        expect(getUser.groups.includes(newGroupID)).toBe(true)
    })

    //Associate a group to a user
    test('Add unexisting group to a user', async () => {
        await services.createUser("Manuel")
        try {
            await services.addGroupToUser("Manuel", 93)
        } catch (err) {
            expect(err).toBe(error.DATA_MEM_GROUP_DOES_NOT_EXIST)
        }
    })

    //Delete group from a user
    test('Delete group from a user', async () => {
        let newGroupID = await services.createGroup(test_user, "A", "B")
        await services.addGroupToUser(test_user, newGroupID)
        expect(await services.userHasGroup(test_user, newGroupID)).toBe(true)
        await services.deleteGroupFromUser(test_user, newGroupID)
        expect(await services.userHasGroup(test_user, newGroupID)).toBe(false)
    })

    //Get Groups from Users
    test('Get groups id from users', async () => {
        let newGroupID = await services.createGroup(test_user, "Novo Grupo", "nova descrição")
        let newGroupID2 = await services.createGroup(test_user, "Novo Grupo 2", "nova descrição 2")
        // Only two of the following are actual groups
        await services.addGroupToUser(test_user, newGroupID2)
        await services.addGroupToUser(test_user, newGroupID)
        // User will still have groups = [33, 90, 1, 2] even though 33 and 90 do not exist
        // The function below will only return the existing groups and remove others from user groups
        expect((await services.getUserGroups(test_user)).length).toBe(2)
    })
})